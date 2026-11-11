package app.stoic.device

import android.accessibilityservice.AccessibilityService
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.accessibility.AccessibilityEvent
import java.util.Calendar

/**
 * Watches which app comes to the front and shows STOIC's pause / time's-up /
 * focus / schedule screen when one of the user's own rules says so. Also turns
 * Do Not Disturb on and off for schedules that ask for it (Bedtime).
 *
 * Privacy: the service is configured with canRetrieveWindowContent=false, so it
 * cannot read what is on screen or what is typed. It only receives the package
 * name of the app whose window opened.
 */
class StoicAccessibilityService : AccessibilityService() {
  private lateinit var store: Store
  private val handler = Handler(Looper.getMainLooper())
  private var currentPkg: String? = null
  /** Was the app in front allowed (in use) at the last check? */
  private var currentAllowed = false
  /** When each app was last actually in use, to tell a new open from a quick return. */
  private val lastUsed = HashMap<String, Long>()

  private var essentials: Set<String> = emptySet()
  private var essentialsAt = 0L
  private val launchable = HashMap<String, Boolean>()

  /** Re-check the app in front every so often: a limit can run out, or a schedule start, while the app stays open. */
  private val tick = object : Runnable {
    override fun run() {
      val pkg = currentPkg
      if (pkg != null && watched(pkg)) {
        // Still using the app: keep "Open anyway" alive so the pause does not reappear mid-use.
        refreshGrace(pkg)
        evaluate(pkg, arrival = false)
        handler.postDelayed(this, TICK_MS)
      }
    }
  }

  /** Once a minute: switch Do Not Disturb on or off to match the schedules. */
  private val minuteTick = object : Runnable {
    override fun run() {
      syncDnd()
      handler.postDelayed(this, MINUTE_MS)
    }
  }

  override fun onServiceConnected() {
    store = Store(this)
    handler.post(minuteTick)
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event?.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return
    val pkg = event.packageName?.toString() ?: return
    if (pkg == packageName) return // our own screens, including the block screen
    if (pkg == currentPkg) return // moving between screens of the same app
    // Keyboards, the notification shade and similar overlays are not "opening an app".
    if (pkg == "com.android.systemui" || isInputMethod(pkg)) return

    // Leaving the previous app: remember when it was last in use.
    val now = System.currentTimeMillis()
    currentPkg?.let { prev -> if (currentAllowed) lastUsed[prev] = now }
    currentPkg = pkg
    currentAllowed = false
    handler.removeCallbacks(tick)
    if (watched(pkg)) {
      // Back in an app still covered by "Open anyway": refresh it now. Waiting for the first
      // re-check let a nearly expired grace run out and pause the app mid-use.
      refreshGrace(pkg)
      evaluate(pkg, arrival = true)
      handler.postDelayed(tick, TICK_MS)
    }
  }

  /** Does anything apply to this app? Any enabled schedule may (Bedtime can cover "all apps"). */
  private fun watched(pkg: String): Boolean =
    store.rules().containsKey(pkg) || store.schedules().any { it.enabled }

  private fun refreshGrace(pkg: String) {
    val now = System.currentTimeMillis()
    val current = store.graceUntil(pkg)
    val refreshed = Blocker.refreshedGrace(current, now)
    if (refreshed != current) store.setGraceUntil(pkg, refreshed)
  }

  private fun isInputMethod(pkg: String): Boolean {
    val id = Settings.Secure.getString(contentResolver, Settings.Secure.DEFAULT_INPUT_METHOD) ?: return false
    return id.startsWith("$pkg/")
  }

  private fun essentials(): Set<String> {
    val now = System.currentTimeMillis()
    // Refresh now and then: the user may change their default phone or SMS app.
    if (now - essentialsAt > ESSENTIALS_TTL_MS) {
      essentials = Essentials.packages(this)
      essentialsAt = now
      launchable.clear()
    }
    return essentials
  }

  private fun isLaunchable(pkg: String): Boolean =
    launchable.getOrPut(pkg) { packageManager.getLaunchIntentForPackage(pkg) != null }

  /** @param arrival the app just came to the front (rather than a re-check while it stays open). */
  private fun evaluate(pkg: String, arrival: Boolean) {
    val rule = store.rules()[pkg]
    val now = System.currentTimeMillis()
    val (isoDay, minute) = localTime(now)
    val day = UsageReader.dayKey(UsageReader.dayStart(0))
    val schedule = Schedules.blocking(store.schedules(), pkg, isoDay, minute, essentials(), store.alwaysAllowed(), ::isLaunchable)
    val used = if (rule != null && rule.limitMin > 0 && UsageReader.hasAccess(this)) UsageReader.todayMs(this, pkg) else null

    // A new open is counted only once the user actually gets into the app (below), so a pause
    // they back out of is not an open, and coming back within OPEN_GAP_MS is the same visit.
    val newOpen = arrival && Blocker.isNewOpen(lastUsed[pkg] ?: 0, now)
    if (rule != null && store.sessionStart(pkg) == 0L) store.setSessionStart(pkg, now)
    val decision = Blocker.decide(
      rule, now, used, store.focusUntil, store.graceUntil(pkg), store.extendUntil(pkg),
      schedule = schedule, snoozeUntil = store.snoozeUntil(pkg),
      opensToday = if (newOpen) store.opensToday(pkg, day) else null,
      extraOpens = store.extraOpensToday(pkg, day),
      sessionMs = if (newOpen) 0 else now - store.sessionStart(pkg),
    )
    if (decision == Decision.ALLOW) {
      if (newOpen && rule != null) {
        store.addOpen(pkg, day)
        store.setSessionStart(pkg, now)
      }
      lastUsed[pkg] = now
      currentAllowed = true
      return
    }

    val label = rule?.label ?: UsageReader.launchableLabel(this, pkg) ?: pkg
    startActivity(
      Intent(this, BlockActivity::class.java)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_NO_ANIMATION)
        .putExtra(BlockActivity.EXTRA_KIND, decision.name)
        .putExtra(BlockActivity.EXTRA_PACKAGE, pkg)
        .putExtra(BlockActivity.EXTRA_LABEL, label)
        .putExtra(BlockActivity.EXTRA_LIMIT_MIN, rule?.limitMin ?: 0)
        .putExtra(BlockActivity.EXTRA_ALLOW_EXTEND, rule?.allowExtend ?: false)
        .putExtra(BlockActivity.EXTRA_FOCUS_UNTIL, store.focusUntil)
        .putExtra(BlockActivity.EXTRA_SCHEDULE_NAME, schedule?.name)
        .putExtra(BlockActivity.EXTRA_SCHEDULE_BEDTIME, schedule?.isBedtime ?: false)
        .putExtra(BlockActivity.EXTRA_SCHEDULE_END_MIN, schedule?.endMin ?: 0)
        .putExtra(BlockActivity.EXTRA_SCHEDULE_SNOOZE, schedule?.allowSnooze ?: false)
        .putExtra(BlockActivity.EXTRA_MAX_OPENS, rule?.maxOpens ?: 0)
        .putExtra(BlockActivity.EXTRA_CHECKIN_MIN, ((now - store.sessionStart(pkg)) / 60_000L).toInt()),
    )
    // The block screen is now in front. Forget the app so returning to it is checked again.
    currentPkg = null
    currentAllowed = false
    handler.removeCallbacks(tick)
  }

  private fun syncDnd() {
    val (isoDay, minute) = localTime(System.currentTimeMillis())
    Dnd.sync(this, store, Schedules.dndWanted(store.schedules(), isoDay, minute))
  }

  override fun onInterrupt() {}

  override fun onDestroy() {
    handler.removeCallbacks(tick)
    handler.removeCallbacks(minuteTick)
    super.onDestroy()
  }

  companion object {
    private const val TICK_MS = 20_000L
    private const val MINUTE_MS = 60_000L
    private const val ESSENTIALS_TTL_MS = 10 * 60_000L

    /** (ISO day 1 = Monday ... 7 = Sunday, minutes after midnight) in local time. */
    fun localTime(now: Long): Pair<Int, Int> {
      val c = Calendar.getInstance().apply { timeInMillis = now }
      val isoDay = (c.get(Calendar.DAY_OF_WEEK) + 5) % 7 + 1
      return isoDay to (c.get(Calendar.HOUR_OF_DAY) * 60 + c.get(Calendar.MINUTE))
    }

    /** True when the user has switched this service on in Accessibility settings. */
    fun isEnabled(context: Context): Boolean {
      val enabled = Settings.Secure.getString(context.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES)
        ?: return false
      val me = ComponentName(context, StoicAccessibilityService::class.java)
      return enabled.split(':').any { ComponentName.unflattenFromString(it) == me }
    }
  }
}
