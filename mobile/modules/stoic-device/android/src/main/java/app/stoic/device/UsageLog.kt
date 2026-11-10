package app.stoic.device

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

/**
 * STOIC's own record of daily screen time, in the app's private storage.
 *
 * Add-only: for each day and app the stored time can go up but never down,
 * and days are never removed (except very old ones, see MAX_DAYS). So once a
 * day has been recorded, uninstalling another app can no longer erase it,
 * which fixes the "uninstall hides the history" problem.
 *
 * It lives on this phone only. Clearing STOIC's data or uninstalling STOIC
 * deletes it; only a server copy could survive that (not built).
 */
object UsageLog {
  private const val FILE = "usage-log.json"
  private const val MAX_DAYS = 180
  private const val MAX_HEARTBEATS = 800
  /** Android keeps detailed usage events for only a few days. */
  private const val LOOKBACK_DAYS = 6

  private fun file(context: Context) = File(context.filesDir, FILE)

  @Synchronized
  fun read(context: Context): JSONObject {
    val f = file(context)
    if (!f.exists()) return empty()
    return try {
      JSONObject(f.readText()).also {
        if (!it.has("days")) it.put("days", JSONObject())
        if (!it.has("heartbeats")) it.put("heartbeats", JSONArray())
      }
    } catch (_: Exception) {
      empty()
    }
  }

  private fun empty() = JSONObject().put("days", JSONObject()).put("heartbeats", JSONArray())

  @Synchronized
  private fun write(context: Context, root: JSONObject) {
    // Write to a temp file, then swap, so a crash cannot leave a half-written log.
    val tmp = File(context.filesDir, "$FILE.tmp")
    tmp.writeText(root.toString())
    if (!tmp.renameTo(file(context))) {
      file(context).writeText(root.toString())
      tmp.delete()
    }
  }

  /**
   * Read the last few days from Android and merge them into the log.
   * Returns false (and records no heartbeat) when Usage access is off, so the
   * gap shows up as "unverified" rather than as a quiet day.
   */
  @Synchronized
  fun record(context: Context): Boolean {
    if (!UsageReader.hasAccess(context)) return false
    val now = System.currentTimeMillis()
    val root = read(context)
    val days = root.getJSONObject("days")

    for (daysAgo in 0..LOOKBACK_DAYS) {
      val start = UsageReader.dayStart(daysAgo)
      val end = if (daysAgo == 0) now else UsageReader.dayStart(daysAgo - 1)
      val usage = UsageReader.foregroundMs(context, start, end)
      if (usage.isEmpty()) continue
      val key = UsageReader.dayKey(start)
      val day = days.optJSONObject(key) ?: JSONObject().put("apps", JSONObject())
      val apps = day.getJSONObject("apps")
      for ((pkg, ms) in usage) {
        if (ms < 1_000) continue
        val label = UsageReader.launchableLabel(context, pkg) ?: continue
        val prev = apps.optJSONObject(pkg)
        // Add-only merge: keep the larger value.
        if (prev == null || ms > prev.optLong("ms")) apps.put(pkg, JSONObject().put("label", label).put("ms", ms))
      }
      if (apps.length() > 0) {
        day.put("recordedAt", now)
        days.put(key, day)
      }
    }

    // Drop only very old days, to keep the file small.
    val keys = days.keys().asSequence().toList().sorted()
    keys.dropLast(MAX_DAYS).forEach { days.remove(it) }

    val beats = root.getJSONArray("heartbeats")
    beats.put(now)
    val trimmed = JSONArray()
    val from = maxOf(0, beats.length() - MAX_HEARTBEATS)
    for (i in from until beats.length()) trimmed.put(beats.getLong(i))
    root.put("heartbeats", trimmed)

    write(context, root)
    return true
  }

  /** Days as a JSON array for the app: [{day, recordedAt, totalMs, apps:[{packageName,label,ms}]}], newest first. */
  fun daysJson(context: Context): String {
    val days = read(context).getJSONObject("days")
    val out = JSONArray()
    for (key in days.keys().asSequence().toList().sortedDescending()) {
      val day = days.getJSONObject(key)
      val apps = day.getJSONObject("apps")
      val list = apps.keys().asSequence().map { pkg ->
        val a = apps.getJSONObject(pkg)
        Triple(pkg, a.optString("label", pkg), a.optLong("ms"))
      }.sortedByDescending { it.third }.toList()
      val arr = JSONArray()
      list.forEach { arr.put(JSONObject().put("packageName", it.first).put("label", it.second).put("ms", it.third)) }
      out.put(
        JSONObject().put("day", key).put("recordedAt", day.optLong("recordedAt"))
          .put("totalMs", list.sumOf { it.third }).put("apps", arr),
      )
    }
    return out.toString()
  }

  fun heartbeatsJson(context: Context): String = read(context).getJSONArray("heartbeats").toString()
}
