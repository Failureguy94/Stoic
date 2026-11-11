package app.stoic.device

import android.accessibilityservice.AccessibilityService
import android.content.ComponentName
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.Toast

/**
 * Optional Shorts & Reels blocker, separate from STOIC's main service.
 *
 * Android only sends it events from YouTube and Instagram (packageNames in
 * stoic_reels_service.xml). It looks at the names of the views on screen
 * (resource ids such as "reel_recycler"), never at text, and when Shorts or
 * Reels fill the screen it goes back. Nothing is stored or sent anywhere.
 */
class StoicReelsService : AccessibilityService() {
  private lateinit var store: Store
  private val handler = Handler(Looper.getMainLooper())
  private var lastActionAt = 0L
  private var pending = false

  override fun onServiceConnected() {
    store = Store(this)
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    val pkg = event?.packageName?.toString() ?: return
    if (pkg !in Reels.PACKAGES) return
    if (!Reels.blocking(pkg, store.reelsYouTube, store.reelsInstagram)) return
    // Content changes come in bursts while scrolling: check at most once per 300 ms.
    if (pending) return
    pending = true
    handler.postDelayed({
      pending = false
      check(pkg)
    }, 300)
  }

  private fun check(pkg: String) {
    val now = System.currentTimeMillis()
    if (now - lastActionAt < Reels.COOLDOWN_MS) return
    val root = rootInActiveWindow ?: return
    if (root.packageName?.toString() != pkg) return
    if (!Reels.isShortForm(pkg, viewIds(root))) return

    lastActionAt = now
    performGlobalAction(GLOBAL_ACTION_BACK)
    store.addReelsBlocked(UsageReader.dayKey(UsageReader.dayStart(0)))
    Toast.makeText(
      this,
      getString(if (pkg == Reels.YOUTUBE) R.string.stoic_reels_toast_shorts else R.string.stoic_reels_toast_reels),
      Toast.LENGTH_SHORT,
    ).show()
  }

  /** The resource ids of the views on screen, breadth first, up to Reels.MAX_NODES. Text is never read. */
  private fun viewIds(root: AccessibilityNodeInfo): Sequence<String?> = sequence {
    val queue = ArrayDeque<AccessibilityNodeInfo>()
    queue.add(root)
    var seen = 0
    while (queue.isNotEmpty() && seen < Reels.MAX_NODES) {
      val node = queue.removeFirst()
      seen++
      yield(node.viewIdResourceName)
      for (i in 0 until node.childCount) node.getChild(i)?.let(queue::add)
    }
  }

  override fun onInterrupt() {}

  override fun onDestroy() {
    handler.removeCallbacksAndMessages(null)
    super.onDestroy()
  }

  companion object {
    fun isEnabled(context: Context): Boolean {
      val enabled = Settings.Secure.getString(context.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES)
        ?: return false
      val me = ComponentName(context, StoicReelsService::class.java)
      return enabled.split(':').any { ComponentName.unflattenFromString(it) == me }
    }
  }
}
