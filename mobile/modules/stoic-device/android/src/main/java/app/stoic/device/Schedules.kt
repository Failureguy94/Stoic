package app.stoic.device

import org.json.JSONArray
import org.json.JSONObject

/**
 * A repeating time window that blocks apps: Bedtime, or the user's own
 * schedules such as "Study hours". Pure Kotlin, unit-tested in SchedulesTest.kt.
 */
data class Schedule(
  val id: String,
  val name: String,
  val isBedtime: Boolean,
  val enabled: Boolean,
  /** ISO days the window STARTS on: 1 = Monday ... 7 = Sunday. */
  val days: Set<Int>,
  /** Minutes after midnight. If end <= start the window runs past midnight into the next day. */
  val startMin: Int,
  val endMin: Int,
  /** true: block every app except essentials and the always-allowed list. false: only `packages`. */
  val allApps: Boolean,
  val packages: Set<String>,
  /** Turn on Do Not Disturb while the window is active (needs Do Not Disturb access). */
  val dnd: Boolean,
  /** Offer "5 more minutes" on the block screen. */
  val allowSnooze: Boolean,
)

object Schedules {
  private const val DAY_MIN = 24 * 60

  /** Is the window active at this local time? */
  fun isActive(s: Schedule, isoDay: Int, minute: Int): Boolean {
    if (!s.enabled || s.days.isEmpty()) return false
    val prevDay = if (isoDay == 1) 7 else isoDay - 1
    return when {
      // Same start and end: the whole day.
      s.startMin == s.endMin -> isoDay in s.days
      // Ordinary window inside one day, e.g. 09:00-17:00.
      s.startMin < s.endMin -> isoDay in s.days && minute >= s.startMin && minute < s.endMin
      // Window past midnight, e.g. 23:00-07:00: belongs to the day it starts on.
      else -> (isoDay in s.days && minute >= s.startMin) || (prevDay in s.days && minute < s.endMin)
    }
  }

  /**
   * The schedule that blocks `pkg` right now, or null.
   * Essential apps (phone, messages, alarm clock, home screen, Settings, STOIC) are never blocked,
   * so emergencies and morning alarms always work. Always-allowed apps are skipped by "all apps" schedules.
   */
  fun blocking(
    schedules: List<Schedule>,
    pkg: String,
    isoDay: Int,
    minute: Int,
    essential: Set<String>,
    alwaysAllowed: Set<String>,
    isLaunchable: (String) -> Boolean,
  ): Schedule? {
    if (pkg in essential) return null
    return schedules.firstOrNull { s ->
      isActive(s, isoDay, minute) &&
        if (s.allApps) pkg !in alwaysAllowed && isLaunchable(pkg) else pkg in s.packages
    }
  }

  /** Should Do Not Disturb be on right now? */
  fun dndWanted(schedules: List<Schedule>, isoDay: Int, minute: Int): Boolean =
    schedules.any { it.dnd && isActive(it, isoDay, minute) }

  fun parse(json: String): List<Schedule> {
    val out = ArrayList<Schedule>()
    try {
      val arr = JSONArray(json)
      for (i in 0 until arr.length()) {
        val o: JSONObject = arr.getJSONObject(i)
        val id = o.optString("id")
        if (id.isEmpty()) continue
        out.add(
          Schedule(
            id = id,
            name = o.optString("name", "Schedule"),
            isBedtime = o.optString("kind") == "bedtime",
            enabled = o.optBoolean("enabled", false),
            days = o.optJSONArray("days").toIntSet().filter { it in 1..7 }.toSet(),
            startMin = o.optInt("startMin", 0).mod(DAY_MIN),
            endMin = o.optInt("endMin", 0).mod(DAY_MIN),
            allApps = o.optBoolean("allApps", false),
            packages = o.optJSONArray("packages").toStringSet(),
            dnd = o.optBoolean("dnd", false),
            allowSnooze = o.optBoolean("allowSnooze", true),
          ),
        )
      }
    } catch (_: Exception) {
      // Corrupt schedules: behave as if there are none rather than crash the service.
    }
    return out
  }

  fun parsePackages(json: String): Set<String> = try { JSONArray(json).toStringSet() } catch (_: Exception) { emptySet() }

  private fun JSONArray?.toIntSet(): Set<Int> {
    if (this == null) return emptySet()
    return (0 until length()).mapNotNull { optInt(it, -1).takeIf { v -> v >= 0 } }.toSet()
  }

  private fun JSONArray?.toStringSet(): Set<String> {
    if (this == null) return emptySet()
    return (0 until length()).mapNotNull { optString(it).takeIf { s -> s.isNotEmpty() } }.toSet()
  }
}
