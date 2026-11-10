package app.stoic.device

import android.app.AppOpsManager
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Process
import java.util.Calendar

/**
 * Reads foreground time per app from Android's UsageStatsManager.
 * Needs the "Usage access" permission, which the user grants in Settings.
 */
object UsageReader {
  fun hasAccess(context: Context): Boolean {
    val ops = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      ops.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
    } else {
      @Suppress("DEPRECATION")
      ops.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), context.packageName)
    }
    return mode == AppOpsManager.MODE_ALLOWED
  }

  /** Start of the local day that is `daysAgo` days before today. */
  fun dayStart(daysAgo: Int): Long {
    val c = Calendar.getInstance()
    c.set(Calendar.HOUR_OF_DAY, 0); c.set(Calendar.MINUTE, 0); c.set(Calendar.SECOND, 0); c.set(Calendar.MILLISECOND, 0)
    c.add(Calendar.DAY_OF_YEAR, -daysAgo)
    return c.timeInMillis
  }

  fun dayKey(startMs: Long): String {
    val c = Calendar.getInstance().apply { timeInMillis = startMs }
    return "%04d-%02d-%02d".format(c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1, c.get(Calendar.DAY_OF_MONTH))
  }

  /**
   * Foreground milliseconds per package between `begin` and `end`, from
   * resume/pause events. Returns an empty map if there are no events
   * (Android keeps detailed events for only a few days).
   */
  fun foregroundMs(context: Context, begin: Long, end: Long): Map<String, Long> {
    val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    val events = usm.queryEvents(begin, end) ?: return emptyMap()
    return pairEvents(readEvents(events), begin, minOf(end, System.currentTimeMillis()))
  }

  data class Ev(val pkg: String, val time: Long, val resumed: Boolean)

  private fun readEvents(events: UsageEvents): List<Ev> {
    val out = ArrayList<Ev>()
    val e = UsageEvents.Event()
    while (events.hasNextEvent()) {
      events.getNextEvent(e)
      when (e.eventType) {
        UsageEvents.Event.ACTIVITY_RESUMED -> out.add(Ev(e.packageName, e.timeStamp, true))
        UsageEvents.Event.ACTIVITY_PAUSED, UsageEvents.Event.ACTIVITY_STOPPED -> out.add(Ev(e.packageName, e.timeStamp, false))
      }
    }
    return out
  }

  /**
   * Turns resume/pause events into totals (pure function, unit-tested).
   * An app already open at `begin` is counted from `begin`; an app still open
   * at the end is counted up to `end`.
   */
  fun pairEvents(events: List<Ev>, begin: Long, end: Long): Map<String, Long> {
    val totals = HashMap<String, Long>()
    val openSince = HashMap<String, Long>()
    val seen = HashSet<String>()
    for (ev in events) {
      if (ev.resumed) {
        if (!openSince.containsKey(ev.pkg)) openSince[ev.pkg] = ev.time
      } else {
        val start = openSince.remove(ev.pkg) ?: if (seen.contains(ev.pkg)) null else begin
        if (start != null && ev.time > start) totals[ev.pkg] = (totals[ev.pkg] ?: 0) + (ev.time - start)
      }
      seen.add(ev.pkg)
    }
    for ((pkg, start) in openSince) {
      if (end > start) totals[pkg] = (totals[pkg] ?: 0) + (end - start)
    }
    return totals
  }

  /** Today's foreground time for one app (used by the limit check). */
  fun todayMs(context: Context, pkg: String): Long =
    foregroundMs(context, dayStart(0), System.currentTimeMillis())[pkg] ?: 0

  /** Label for an installed, launchable app, or null if it is not one (system screens, launchers, uninstalled apps). */
  fun launchableLabel(context: Context, pkg: String): String? {
    val pm = context.packageManager
    if (pkg == context.packageName) return null
    if (pm.getLaunchIntentForPackage(pkg) == null) return null
    return try {
      pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString()
    } catch (_: Exception) {
      null
    }
  }

  /** Apps with a launcher icon, other than STOIC itself: (package, label), sorted by label. */
  fun launchableApps(context: Context): List<Pair<String, String>> {
    val pm = context.packageManager
    val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
    return pm.queryIntentActivities(intent, 0)
      .map { it.activityInfo.packageName }
      .distinct()
      .filter { it != context.packageName }
      .map { it to (try { pm.getApplicationLabel(pm.getApplicationInfo(it, 0)).toString() } catch (_: Exception) { it }) }
      .sortedBy { it.second.lowercase() }
  }
}
