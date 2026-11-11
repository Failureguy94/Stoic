package app.stoic.device

import org.json.JSONArray
import org.json.JSONObject

/**
 * Website blocking settings and matching. Pure Kotlin, unit-tested in SitesTest.kt.
 */
data class SiteSettings(
  /** Block the listed sites. */
  val enabled: Boolean,
  /** Domains, e.g. "youtube.com". Subdomains are blocked too. */
  val sites: Set<String>,
  /** true: always. false: only during focus sessions and schedules. */
  val always: Boolean,
  /** During focus sessions and schedules, turn off internet for every app except essentials and always-allowed. */
  val internetOff: Boolean,
)

object Sites {
  val OFF = SiteSettings(enabled = false, sites = emptySet(), always = false, internetOff = false)

  /**
   * "https://www.YouTube.com/watch?v=1" -> "youtube.com". Returns null for anything that is not a domain.
   * Only "www." and "m." are stripped, so "music.youtube.com" can be blocked on its own.
   */
  fun normalize(input: String): String? {
    var s = input.trim().lowercase()
    s = s.substringAfter("://")
    s = s.substringBefore('/').substringBefore('?').substringBefore('#').substringBefore(':')
    s = s.trimEnd('.')
    for (prefix in listOf("www.", "m.")) if (s.startsWith(prefix)) s = s.removePrefix(prefix)
    val label = Regex("^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$")
    val parts = s.split('.')
    if (parts.size < 2 || parts.any { !label.matches(it) }) return null
    return s
  }

  /** Is `host` one of the sites, or a subdomain of one? */
  fun isBlocked(host: String, sites: Set<String>): Boolean {
    var h = host.lowercase().trimEnd('.')
    while (true) {
      if (h in sites) return true
      val dot = h.indexOf('.')
      if (dot < 0) return false
      h = h.substring(dot + 1)
    }
  }

  /** Should site blocking apply right now? */
  fun sitesActive(s: SiteSettings, blockingNow: Boolean) = s.enabled && s.sites.isNotEmpty() && (s.always || blockingNow)

  /** Should internet be off right now? */
  fun internetOffNow(s: SiteSettings, blockingNow: Boolean) = s.internetOff && blockingNow

  /** Does the VPN need to run at all? */
  fun vpnNeeded(s: SiteSettings) = (s.enabled && s.sites.isNotEmpty()) || s.internetOff

  fun parse(json: String): SiteSettings = try {
    val o = JSONObject(json)
    val arr = o.optJSONArray("sites") ?: JSONArray()
    SiteSettings(
      enabled = o.optBoolean("enabled", false),
      sites = (0 until arr.length()).mapNotNull { normalize(arr.optString(it)) }.toSet(),
      always = o.optBoolean("always", true),
      internetOff = o.optBoolean("internetOff", false),
    )
  } catch (_: Exception) {
    OFF
  }
}

/** Minimal DNS message handling: read the question, answer "no such domain". */
object Dns {
  /** The name asked about in a DNS query, or null if it isn't a plain query. */
  fun questionName(msg: ByteArray, offset: Int = 0, length: Int = msg.size - offset): String? {
    if (length < 12) return null
    val flags = ((msg[offset + 2].toInt() and 0xFF) shl 8) or (msg[offset + 3].toInt() and 0xFF)
    if (flags and 0x8000 != 0) return null // a response, not a query
    val qd = ((msg[offset + 4].toInt() and 0xFF) shl 8) or (msg[offset + 5].toInt() and 0xFF)
    if (qd < 1) return null
    var i = offset + 12
    val end = offset + length
    val labels = ArrayList<String>()
    while (i < end) {
      val len = msg[i].toInt() and 0xFF
      if (len == 0) return labels.joinToString(".").lowercase()
      if (len and 0xC0 != 0 || i + 1 + len > end) return null // compression is not used in questions
      labels.add(String(msg, i + 1, len, Charsets.US_ASCII))
      i += 1 + len
    }
    return null
  }

  /** A reply to `query` saying the name does not exist (NXDOMAIN), keeping the question. */
  fun nxdomain(query: ByteArray, offset: Int = 0, length: Int = query.size - offset): ByteArray {
    val out = query.copyOfRange(offset, offset + length)
    // Flags: QR=1 (response), keep opcode and RD, RA=1, RCODE=3 (NXDOMAIN).
    out[2] = ((out[2].toInt() and 0x79) or 0x80).toByte()
    out[3] = 0x83.toByte()
    // One question, no answers, authority or additional records.
    out[6] = 0; out[7] = 0; out[8] = 0; out[9] = 0; out[10] = 0; out[11] = 0
    // Drop anything after the question (e.g. an EDNS record), since we said there are none.
    var i = 12
    while (i < out.size && out[i].toInt() != 0) i += 1 + (out[i].toInt() and 0xFF)
    val questionEnd = minOf(out.size, i + 1 + 4) // zero byte + QTYPE + QCLASS
    return out.copyOfRange(0, questionEnd)
  }
}

/** IPv4 + UDP packets as read from and written to the VPN interface. */
object Packets {
  data class Udp(val src: ByteArray, val dst: ByteArray, val srcPort: Int, val dstPort: Int, val payloadOffset: Int, val payloadLength: Int)

  fun parseIpv4Udp(p: ByteArray, length: Int): Udp? {
    if (length < 28) return null
    if ((p[0].toInt() shr 4) != 4) return null // IPv4 only
    val ihl = (p[0].toInt() and 0x0F) * 4
    if (p[9].toInt() != 17 || length < ihl + 8) return null // UDP only
    val total = ((p[2].toInt() and 0xFF) shl 8) or (p[3].toInt() and 0xFF)
    val udpLen = ((p[ihl + 4].toInt() and 0xFF) shl 8) or (p[ihl + 5].toInt() and 0xFF)
    if (total > length || udpLen < 8 || ihl + udpLen > total) return null
    return Udp(
      src = p.copyOfRange(12, 16),
      dst = p.copyOfRange(16, 20),
      srcPort = ((p[ihl].toInt() and 0xFF) shl 8) or (p[ihl + 1].toInt() and 0xFF),
      dstPort = ((p[ihl + 2].toInt() and 0xFF) shl 8) or (p[ihl + 3].toInt() and 0xFF),
      payloadOffset = ihl + 8,
      payloadLength = udpLen - 8,
    )
  }

  /** Build an IPv4/UDP packet. The UDP checksum is left at 0 ("not used"), which IPv4 allows. */
  fun buildIpv4Udp(src: ByteArray, dst: ByteArray, srcPort: Int, dstPort: Int, payload: ByteArray): ByteArray {
    val total = 20 + 8 + payload.size
    val p = ByteArray(total)
    p[0] = 0x45
    p[2] = (total shr 8).toByte(); p[3] = total.toByte()
    p[8] = 64 // TTL
    p[9] = 17 // UDP
    System.arraycopy(src, 0, p, 12, 4)
    System.arraycopy(dst, 0, p, 16, 4)
    val sum = checksum(p, 0, 20)
    p[10] = (sum shr 8).toByte(); p[11] = sum.toByte()
    p[20] = (srcPort shr 8).toByte(); p[21] = srcPort.toByte()
    p[22] = (dstPort shr 8).toByte(); p[23] = dstPort.toByte()
    val udpLen = 8 + payload.size
    p[24] = (udpLen shr 8).toByte(); p[25] = udpLen.toByte()
    System.arraycopy(payload, 0, p, 28, payload.size)
    return p
  }

  fun checksum(b: ByteArray, offset: Int, length: Int): Int {
    var sum = 0L
    var i = offset
    while (i < offset + length - 1) {
      sum += ((b[i].toInt() and 0xFF) shl 8) or (b[i + 1].toInt() and 0xFF)
      i += 2
    }
    if (length % 2 == 1) sum += (b[offset + length - 1].toInt() and 0xFF) shl 8
    while (sum shr 16 != 0L) sum = (sum and 0xFFFF) + (sum shr 16)
    return (sum.inv() and 0xFFFF).toInt()
  }
}
