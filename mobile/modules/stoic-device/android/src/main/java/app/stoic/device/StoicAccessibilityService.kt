package app.stoic.device

import android.accessibilityservice.AccessibilityService
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.accessibility.AccessibilityEvent

/**
 * Watches which app comes to the front and shows STOIC's pause / time's-up /
 * focus screen when one of the user's own rules says so.
 *
 * Privacy: the service is configured with canRetrieveWindowContent=false, so it
 * cannot read what is on screen or what is typed. It only receives the package
 * name of the app whose window opened.
 */
class StoicAccessibilityService : AccessibilityService() {
  private lateinit var store: Store
  private val handler = Handler(Looper.getMainLooper())
  private var currentPkg: String? = null

  /** Re-check the app in front every so often: a limit can run out while the app stays open. */
  private val tick = object : Runnable {
    override fun run() {
      val pkg = currentPkg
      if (pkg != null && store.rules().containsKey(pkg)) {
        // Still using the app: keep "Open anyway" alive so the pause does not reappear mid-use.
        if (store.graceUntil(pkg) > System.currentTimeMillis()) {
          store.setGraceUntil(pkg, System.currentTimeMillis() + Blocker.GRACE_MS)
        }
        evaluate(pkg)
        handler.postDelayed(this, TICK_MS)
      }
    }
  }

  override fun onServiceConnected() {
    store = Store(this)
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event?.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
    val pkg = event.packageName?.toString() ?: return
    if (pkg == packageName) return // our own screens, including the block screen
    if (pkg == currentPkg) return // moving between screens of the same app
    // Keyboards, the notification shade and similar overlays are not "opening an app".
    if (pkg == "com.android.systemui" || isInputMethod(pkg)) return

    currentPkg = pkg
    handler.removeCallbacks(tick)
    if (store.rules().containsKey(pkg)) {
      evaluate(pkg)
      handler.postDelayed(tick, TICK_MS)
    }
  }

  private fun isInputMethod(pkg: String): Boolean {
    val id = Settings.Secure.getString(contentResolver, Settings.Secure.DEFAULT_INPUT_METHOD) ?: return false
    return id.startsWith("$pkg/")
  }

  private fun evaluate(pkg: String) {
    val rule = store.rules()[pkg] ?: return
    val now = System.currentTimeMillis()
    val used = if (rule.limitMin > 0 && UsageReader.hasAccess(this)) UsageReader.todayMs(this, pkg) else null
    val decision = Blocker.decide(rule, now, used, store.focusUntil, store.graceUntil(pkg), store.extendUntil(pkg))
    if (decision == Decision.ALLOW) return

    startActivity(
      Intent(this, BlockActivity::class.java)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NO_ANIMATION)
        .putExtra(BlockActivity.EXTRA_KIND, decision.name)
        .putExtra(BlockActivity.EXTRA_PACKAGE, pkg)
        .putExtra(BlockActivity.EXTRA_LABEL, rule.label)
        .putExtra(BlockActivity.EXTRA_LIMIT_MIN, rule.limitMin)
        .putExtra(BlockActivity.EXTRA_ALLOW_EXTEND, rule.allowExtend)
        .putExtra(BlockActivity.EXTRA_FOCUS_UNTIL, store.focusUntil),
    )
    // The block screen is now in front. Forget the app so returning to it is checked again.
    currentPkg = null
    handler.removeCallbacks(tick)
  }

  override fun onInterrupt() {}

  override fun onDestroy() {
    handler.removeCallbacks(tick)
    super.onDestroy()
  }

  companion object {
    private const val TICK_MS = 20_000L

    /** True when the user has switched this service on in Accessibility settings. */
    fun isEnabled(context: Context): Boolean {
      val enabled = Settings.Secure.getString(context.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES)
        ?: return false
      val me = ComponentName(context, StoicAccessibilityService::class.java)
      return enabled.split(':').any { ComponentName.unflattenFromString(it) == me }
    }
  }
}
