package app.stoic.device

import android.content.Context

/** "Is this app blocked right now?" for code outside the accessibility service (notification control). */
class BlockState(private val context: Context, private val store: Store) {
  private var essentials: Set<String> = emptySet()
  private var essentialsAt = 0L
  private val launchable = HashMap<String, Boolean>()

  fun essentials(): Set<String> {
    val now = System.currentTimeMillis()
    if (now - essentialsAt > 10 * 60_000L) {
      essentials = Essentials.packages(context)
      essentialsAt = now
      launchable.clear()
    }
    return essentials
  }

  private fun isLaunchable(pkg: String) =
    launchable.getOrPut(pkg) { context.packageManager.getLaunchIntentForPackage(pkg) != null }

  /** Blocked by a running focus session or an active schedule. */
  fun isBlocked(pkg: String, now: Long): Boolean {
    if (pkg in essentials()) return false
    val rule = store.rules()[pkg]
    if (rule != null && rule.blockInFocus && store.focusUntil > now) return true
    val (isoDay, minute) = StoicAccessibilityService.localTime(now)
    return Schedules.blocking(store.schedules(), pkg, isoDay, minute, essentials(), store.alwaysAllowed(), ::isLaunchable) != null
  }

  /** Is any focus session or schedule running? */
  fun anyActive(now: Long): Boolean {
    if (store.focusUntil > now) return true
    val (isoDay, minute) = StoicAccessibilityService.localTime(now)
    return store.schedules().any { Schedules.isActive(it, isoDay, minute) }
  }
}
