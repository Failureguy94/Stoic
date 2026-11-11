package app.stoic.device

import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.net.VpnService
import android.os.Handler
import android.os.Looper
import android.os.ParcelFileDescriptor
import android.util.Log
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.util.concurrent.Executors

/**
 * Website and internet blocking, entirely on the phone.
 *
 * Normally only DNS goes through this VPN: the phone is told to ask STOIC's
 * address (DNS_IP) for every name lookup. Lookups for blocked sites get "no such
 * domain"; all others are passed to the network's own DNS server unchanged. STOIC
 * never sees page contents, and nothing is sent to a STOIC server.
 *
 * With "Internet off" during focus or a schedule, all traffic is routed here and
 * dropped, except for essential and always-allowed apps, which bypass the VPN.
 */
class StoicVpnService : VpnService() {
  private lateinit var store: Store
  private lateinit var blocks: BlockState
  private var tun: ParcelFileDescriptor? = null
  private var reader: Thread? = null
  private val pool = Executors.newFixedThreadPool(4)
  private val handler = Handler(Looper.getMainLooper())
  private var settings: SiteSettings = Sites.OFF
  private var internetOffMode = false
  private var upstream: InetAddress? = null

  /** Every 30 s: switch "Internet off" on or off as focus sessions and schedules start and end. */
  private val tick = object : Runnable {
    override fun run() {
      try {
        applyMode(force = false)
      } catch (e: Exception) {
        Log.w(TAG, "mode check failed", e)
      }
      handler.postDelayed(this, 30_000L)
    }
  }

  override fun onCreate() {
    super.onCreate()
    store = Store(this)
    blocks = BlockState(this, store)
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == ACTION_STOP) {
      shutdown()
      stopSelf()
      return START_NOT_STICKY
    }
    settings = Sites.parse(store.sitesJson)
    if (!Sites.vpnNeeded(settings)) {
      shutdown()
      stopSelf()
      return START_NOT_STICKY
    }
    applyMode(force = true)
    handler.removeCallbacks(tick)
    handler.postDelayed(tick, 30_000L)
    return START_STICKY
  }

  /** (Re)build the VPN interface if the mode changed (or `force`). */
  @Synchronized
  private fun applyMode(force: Boolean) {
    settings = Sites.parse(store.sitesJson)
    val off = Sites.internetOffNow(settings, blocks.anyActive(System.currentTimeMillis()))
    if (!force && tun != null && off == internetOffMode) return
    if (upstream == null || force) upstream = findUpstreamDns()

    val b = Builder()
      .setSession("STOIC")
      .addAddress(TUN_IP, 32)
      .addDnsServer(DNS_IP)
      .setBlocking(true)
    try {
      b.addDisallowedApplication(packageName) // STOIC's own lookups go straight out
    } catch (_: Exception) {}
    if (off) {
      // Internet off: route everything here (and drop it), except essential and always-allowed apps.
      b.addRoute("0.0.0.0", 0)
      try {
        b.addAddress(TUN_IP6, 128)
        b.addRoute("::", 0)
      } catch (_: Exception) {}
      (blocks.essentials() + store.alwaysAllowed()).forEach { pkg ->
        if (pkg != packageName) {
          try {
            b.addDisallowedApplication(pkg)
          } catch (_: Exception) {
            // Not installed.
          }
        }
      }
    } else {
      // Normal: only DNS lookups come here.
      b.addRoute(DNS_IP, 32)
    }

    val next = b.establish() ?: run {
      Log.w(TAG, "VPN not allowed (consent missing or revoked)")
      shutdown()
      return
    }
    val old = tun
    tun = next
    internetOffMode = off
    startReader(next)
    try {
      old?.close()
    } catch (_: Exception) {}
    running = true
  }

  private fun startReader(fd: ParcelFileDescriptor) {
    val input = FileInputStream(fd.fileDescriptor)
    val output = FileOutputStream(fd.fileDescriptor)
    val t = Thread({
      val buf = ByteArray(32_767)
      try {
        while (!Thread.currentThread().isInterrupted) {
          val n = input.read(buf)
          if (n <= 0) continue
          val udp = Packets.parseIpv4Udp(buf, n) ?: continue // anything else is dropped (Internet off)
          if (udp.dstPort != 53 || !udp.dst.contentEquals(DNS_ADDR)) continue
          val packet = buf.copyOf(n)
          handleDns(packet, udp, output)
        }
      } catch (_: Exception) {
        // Interface closed: a new one replaced it, or the VPN stopped.
      }
    }, "stoic-vpn")
    reader?.interrupt()
    reader = t
    t.start()
  }

  private fun handleDns(packet: ByteArray, udp: Packets.Udp, output: FileOutputStream) {
    val name = Dns.questionName(packet, udp.payloadOffset, udp.payloadLength)
    val blockingNow = blocks.anyActive(System.currentTimeMillis())
    // Internet off: answer every lookup at once, so apps fail fast instead of waiting on dropped traffic.
    val blocked = internetOffMode || (name != null && Sites.sitesActive(settings, blockingNow) && Sites.isBlocked(name, settings.sites))
    if (blocked) {
      reply(output, udp, Dns.nxdomain(packet, udp.payloadOffset, udp.payloadLength))
      return
    }
    val server = upstream ?: return
    pool.execute {
      try {
        DatagramSocket().use { socket ->
          protect(socket) // send outside the VPN
          socket.soTimeout = 5_000
          socket.send(DatagramPacket(packet, udp.payloadOffset, udp.payloadLength, server, 53))
          val resp = ByteArray(4_096)
          val p = DatagramPacket(resp, resp.size)
          socket.receive(p)
          reply(output, udp, resp.copyOf(p.length))
        }
      } catch (_: Exception) {
        // Timeout or no network: the app will retry.
      }
    }
  }

  private fun reply(output: FileOutputStream, q: Packets.Udp, dns: ByteArray) {
    val packet = Packets.buildIpv4Udp(q.dst, q.src, q.dstPort, q.srcPort, dns)
    synchronized(output) {
      try {
        output.write(packet)
      } catch (_: Exception) {}
    }
  }

  /** The DNS server of the real (non-VPN) network, so lookups go where they always did. */
  private fun findUpstreamDns(): InetAddress? {
    val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    @Suppress("DEPRECATION")
    for (net in cm.allNetworks) {
      val caps = cm.getNetworkCapabilities(net) ?: continue
      if (caps.hasTransport(NetworkCapabilities.TRANSPORT_VPN)) continue
      if (!caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)) continue
      val dns = cm.getLinkProperties(net)?.dnsServers ?: continue
      dns.firstOrNull()?.let { return it }
    }
    return InetAddress.getByName(FALLBACK_DNS)
  }

  @Synchronized
  private fun shutdown() {
    handler.removeCallbacks(tick)
    reader?.interrupt()
    reader = null
    try {
      tun?.close()
    } catch (_: Exception) {}
    tun = null
    running = false
  }

  override fun onRevoke() {
    // The user turned the VPN off in Settings, or another VPN app took over.
    shutdown()
    super.onRevoke()
  }

  override fun onDestroy() {
    shutdown()
    pool.shutdownNow()
    super.onDestroy()
  }

  companion object {
    private const val TAG = "StoicVpn"
    const val ACTION_STOP = "app.stoic.device.VPN_STOP"
    private const val TUN_IP = "10.111.222.2"
    private const val TUN_IP6 = "fd00:57:1c::2"
    private const val DNS_IP = "10.111.222.1"
    private val DNS_ADDR = byteArrayOf(10, 111, 222.toByte(), 1)
    /** Used only if the network reports no DNS server. */
    private const val FALLBACK_DNS = "1.1.1.1"

    @Volatile var running = false
      private set

    /** Has the user allowed STOIC's VPN? */
    fun consented(context: Context) = prepare(context) == null

    /** Start, update or stop the VPN to match the saved settings. */
    fun sync(context: Context) {
      val needed = Sites.vpnNeeded(Sites.parse(Store(context).sitesJson))
      try {
        if (needed && consented(context)) {
          context.startService(Intent(context, StoicVpnService::class.java))
        } else if (running) {
          context.startService(Intent(context, StoicVpnService::class.java).setAction(ACTION_STOP))
        }
      } catch (e: Exception) {
        Log.w(TAG, "could not start or stop the VPN", e)
      }
    }
  }
}

/** Restart website blocking after the phone restarts. */
class StoicBootReceiver : android.content.BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action == Intent.ACTION_BOOT_COMPLETED || intent.action == Intent.ACTION_MY_PACKAGE_REPLACED) {
      StoicVpnService.sync(context)
    }
  }
}
