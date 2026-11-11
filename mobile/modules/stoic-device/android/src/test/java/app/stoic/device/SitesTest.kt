package app.stoic.device

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class SitesTest {
  @Test fun normalizeAcceptsWhatPeopleType() {
    assertEquals("youtube.com", Sites.normalize("https://www.YouTube.com/watch?v=abc"))
    assertEquals("youtube.com", Sites.normalize("m.youtube.com"))
    assertEquals("instagram.com", Sites.normalize(" instagram.com/ "))
    assertEquals("music.youtube.com", Sites.normalize("music.youtube.com"))
    assertEquals("reddit.com", Sites.normalize("reddit.com:443"))
    assertNull(Sites.normalize("youtube"))
    assertNull(Sites.normalize("not a site"))
    assertNull(Sites.normalize(""))
  }

  @Test fun subdomainsAreBlockedButLookalikesAreNot() {
    val sites = setOf("youtube.com")
    assertTrue(Sites.isBlocked("youtube.com", sites))
    assertTrue(Sites.isBlocked("www.youtube.com", sites))
    assertTrue(Sites.isBlocked("r3---sn.googlevideo.youtube.com.", sites))
    assertFalse(Sites.isBlocked("notyoutube.com", sites))
    assertFalse(Sites.isBlocked("youtube.com.example.org", sites))
    assertFalse(Sites.isBlocked("google.com", sites))
  }

  @Test fun whenBlockingApplies() {
    val s = SiteSettings(enabled = true, sites = setOf("x.com"), always = false, internetOff = true)
    assertFalse(Sites.sitesActive(s, blockingNow = false))
    assertTrue(Sites.sitesActive(s, blockingNow = true))
    assertTrue(Sites.sitesActive(s.copy(always = true), blockingNow = false))
    assertFalse(Sites.sitesActive(s.copy(enabled = false, always = true), blockingNow = true))
    assertTrue(Sites.internetOffNow(s, blockingNow = true))
    assertFalse(Sites.internetOffNow(s, blockingNow = false))
    assertTrue(Sites.vpnNeeded(s.copy(enabled = false)))
    assertFalse(Sites.vpnNeeded(Sites.OFF))
  }

  @Test fun parseKeepsOnlyValidSites() {
    val s = Sites.parse("""{"enabled":true,"sites":["https://www.reddit.com/r/x","nope",""],"always":false,"internetOff":true}""")
    assertEquals(setOf("reddit.com"), s.sites)
    assertFalse(s.always)
    assertTrue(s.internetOff)
    assertEquals(Sites.OFF, Sites.parse("garbage"))
  }

  // A real DNS query for "www.youtube.com", type A, with an EDNS OPT record at the end.
  private val query: ByteArray = byteArrayOf(
    0x12, 0x34, 0x01, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01,
    3, 'w'.code.toByte(), 'w'.code.toByte(), 'w'.code.toByte(),
    7, 'y'.code.toByte(), 'o'.code.toByte(), 'u'.code.toByte(), 't'.code.toByte(), 'u'.code.toByte(), 'b'.code.toByte(), 'e'.code.toByte(),
    3, 'c'.code.toByte(), 'o'.code.toByte(), 'm'.code.toByte(), 0,
    0x00, 0x01, 0x00, 0x01,
    0x00, 0x00, 0x29, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  )

  @Test fun readsTheQuestion() = assertEquals("www.youtube.com", Dns.questionName(query))

  @Test fun ignoresResponsesAndJunk() {
    val response = query.copyOf().also { it[2] = 0x81.toByte() }
    assertNull(Dns.questionName(response))
    assertNull(Dns.questionName(byteArrayOf(1, 2, 3)))
  }

  @Test fun nxdomainKeepsIdAndQuestionOnly() {
    val r = Dns.nxdomain(query)
    assertEquals(0x12, r[0].toInt()); assertEquals(0x34, r[1].toInt()) // same ID
    assertTrue(r[2].toInt() and 0x80 != 0) // a response
    assertTrue(r[2].toInt() and 0x01 != 0) // recursion desired kept
    assertEquals(3, r[3].toInt() and 0x0F) // NXDOMAIN
    assertEquals(1, r[5].toInt()) // one question
    assertEquals(0, r[11].toInt()) // no additional records
    assertEquals(12 + 17 + 4, r.size) // header + name + type/class, EDNS dropped
  }

  @Test fun udpPacketsRoundTrip() {
    val src = byteArrayOf(10, 0, 0, 2)
    val dst = byteArrayOf(10, 111, 222.toByte(), 1)
    val packet = Packets.buildIpv4Udp(src, dst, 40000, 53, query)
    val parsed = Packets.parseIpv4Udp(packet, packet.size)!!
    assertTrue(parsed.src.contentEquals(src))
    assertTrue(parsed.dst.contentEquals(dst))
    assertEquals(40000, parsed.srcPort)
    assertEquals(53, parsed.dstPort)
    assertEquals(query.size, parsed.payloadLength)
    assertEquals("www.youtube.com", Dns.questionName(packet, parsed.payloadOffset, parsed.payloadLength))
    // A correct IPv4 header checksums to zero.
    assertEquals(0, Packets.checksum(packet, 0, 20))
  }

  @Test fun nonUdpOrNonIpv4IsIgnored() {
    val packet = Packets.buildIpv4Udp(byteArrayOf(1, 1, 1, 1), byteArrayOf(2, 2, 2, 2), 1, 53, query)
    assertNull(Packets.parseIpv4Udp(packet.copyOf().also { it[9] = 6 }, packet.size)) // TCP
    assertNull(Packets.parseIpv4Udp(packet.copyOf().also { it[0] = 0x60 }, packet.size)) // IPv6
  }
}
