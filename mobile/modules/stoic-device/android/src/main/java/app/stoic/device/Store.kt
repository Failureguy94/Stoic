package app.stoic.device

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

/**
 * Rules and timers, kept in the app's private SharedPreferences so the
 * accessibility service can read them without the React Native side running.
 */
class Store(context: Context) {
  private val prefs: SharedPreferences =
    context.applicationContext.getSharedPreferences("stoic_device", Context.MODE_PRIVATE)

  var rulesJson: String
    get() = prefs.getString("rules", "[]") ?: "[]"
    set(value) = prefs.edit().putString("rules", value).apply()

  fun rules(): Map<String, Rule> = parseRules(rulesJson)

  var focusUntil: Long
    get() = prefs.getLong("focusUntil", 0)
    set(value) = prefs.edit().putLong("focusUntil", value).apply()

  /** End of the running Pebble focus session, whether or not it blocks apps (0 = none). */
  var focusSessionUntil: Long
    get() = prefs.getLong("focusSessionUntil", 0)
    set(value) = prefs.edit().putLong("focusSessionUntil", value).apply()

  var logEnabled: Boolean
    get() = prefs.getBoolean("logEnabled", false)
    set(value) = prefs.edit().putBoolean("logEnabled", value).apply()

  fun graceUntil(pkg: String) = prefs.getLong("grace_$pkg", 0)
  fun setGraceUntil(pkg: String, until: Long) = prefs.edit().putLong("grace_$pkg", until).apply()

  var schedulesJson: String
    get() = prefs.getString("schedules", "[]") ?: "[]"
    set(value) = prefs.edit().putString("schedules", value).apply()

  fun schedules(): List<Schedule> = Schedules.parse(schedulesJson)

  /** Apps that "all apps" schedules never block, chosen by the user. */
  var alwaysAllowedJson: String
    get() = prefs.getString("alwaysAllowed", "[]") ?: "[]"
    set(value) = prefs.edit().putString("alwaysAllowed", value).apply()

  fun alwaysAllowed(): Set<String> = Schedules.parsePackages(alwaysAllowedJson)

  /** True while Do Not Disturb is on because STOIC turned it on (so STOIC only turns off what it turned on). */
  var dndOnByStoic: Boolean
    get() = prefs.getBoolean("dndOnByStoic", false)
    set(value) = prefs.edit().putBoolean("dndOnByStoic", value).apply()

  // ---- website blocking ----
  var sitesJson: String
    get() = prefs.getString("sites", "{}") ?: "{}"
    set(value) = prefs.edit().putString("sites", value).apply()

  // ---- strict mode ----

  /** Strict mode is on until this time (epoch ms). */
  var strictUntil: Long
    get() = prefs.getLong("strictUntil", 0)
    set(value) = prefs.edit().putLong("strictUntil", value).apply()

  /** While strict, also cover Settings (blocks switching STOIC off or clearing its data). */
  var strictLockSettings: Boolean
    get() = prefs.getBoolean("strictLockSettings", false)
    set(value) = prefs.edit().putBoolean("strictLockSettings", value).apply()

  /** When "Unlock early" was asked for, 0 if not. */
  var unlockRequestedAt: Long
    get() = prefs.getLong("unlockRequestedAt", 0)
    set(value) = prefs.edit().putLong("unlockRequestedAt", value).apply()

  fun strictActive(now: Long = System.currentTimeMillis()) = Strict.isActive(strictUntil, now)

  // ---- notification control ----

  /** Apps whose notifications are held for the summary. */
  var holdAppsJson: String
    get() = prefs.getString("holdApps", "[]") ?: "[]"
    set(value) = prefs.edit().putString("holdApps", value).apply()

  fun holdApps(): Set<String> = Schedules.parsePackages(holdAppsJson)

  /** Also hold notifications from apps that are blocked right now (focus, bedtime, schedules). */
  var holdWhileBlocked: Boolean
    get() = prefs.getBoolean("holdWhileBlocked", true)
    set(value) = prefs.edit().putBoolean("holdWhileBlocked", value).apply()

  /** Summary times, minutes after midnight. */
  var summaryTimesJson: String
    get() = prefs.getString("summaryTimes", "[780,1140]") ?: "[780,1140]"
    set(value) = prefs.edit().putString("summaryTimes", value).apply()

  fun summaryTimes(): List<Int> = try {
    val arr = org.json.JSONArray(summaryTimesJson)
    (0 until arr.length()).map { arr.getInt(it) }.filter { it in 0 until 24 * 60 }
  } catch (_: Exception) {
    emptyList()
  }

  var lastSummaryAt: Long
    get() = prefs.getLong("lastSummaryAt", 0)
    set(value) = prefs.edit().putLong("lastSummaryAt", value).apply()

  /** Was a focus session or schedule active at the last check? Used to send a summary when it ends. */
  var blockWasActive: Boolean
    get() = prefs.getBoolean("blockWasActive", false)
    set(value) = prefs.edit().putBoolean("blockWasActive", value).apply()

  // ---- opens and check-ins ----

  /** Opens counted today, per app. Resets when the day changes. */
  fun opensToday(pkg: String, day: String): Int = if (prefs.getString("opensDay", "") == day) prefs.getInt("opens_$pkg", 0) else 0

  fun extraOpensToday(pkg: String, day: String): Int = if (prefs.getString("opensDay", "") == day) prefs.getInt("extraOpens_$pkg", 0) else 0

  fun addOpen(pkg: String, day: String) = bump("opens_$pkg", day)

  fun addExtraOpen(pkg: String, day: String) = bump("extraOpens_$pkg", day)

  private fun bump(key: String, day: String) {
    if (prefs.getString("opensDay", "") != day) {
      // New day: forget yesterday's counts.
      val e = prefs.edit()
      prefs.all.keys.filter { it.startsWith("opens_") || it.startsWith("extraOpens_") }.forEach { e.remove(it) }
      e.putString("opensDay", day).commit()
    }
    prefs.edit().putInt(key, prefs.getInt(key, 0) + 1).apply()
  }

  /** Block-screen outcomes today, for the day score: "Go back" vs going past the screen. */
  fun recordChoice(day: String, wentBack: Boolean) {
    if (prefs.getString("choicesDay", "") != day) {
      prefs.edit().putString("choicesDay", day).putInt("wentBack", 0).putInt("overrode", 0).commit()
    }
    val key = if (wentBack) "wentBack" else "overrode"
    prefs.edit().putInt(key, prefs.getInt(key, 0) + 1).apply()
  }

  fun choicesToday(day: String): Pair<Int, Int> =
    if (prefs.getString("choicesDay", "") == day) prefs.getInt("wentBack", 0) to prefs.getInt("overrode", 0) else 0 to 0

  /** When the current visit started, for check-ins. "Keep going" moves it to now. */
  fun sessionStart(pkg: String) = prefs.getLong("session_$pkg", 0)
  fun setSessionStart(pkg: String, at: Long) = prefs.edit().putLong("session_$pkg", at).apply()

  fun snoozeUntil(pkg: String) = prefs.getLong("snooze_$pkg", 0)
  fun setSnoozeUntil(pkg: String, until: Long) = prefs.edit().putLong("snooze_$pkg", until).apply()

  fun extendUntil(pkg: String) = prefs.getLong("extend_$pkg", 0)
  fun setExtendUntil(pkg: String, until: Long) = prefs.edit().putLong("extend_$pkg", until).apply()

  companion object {
    fun parseRules(json: String): Map<String, Rule> {
      val out = LinkedHashMap<String, Rule>()
      try {
        val arr = JSONArray(json)
        for (i in 0 until arr.length()) {
          val o: JSONObject = arr.getJSONObject(i)
          val pkg = o.optString("packageName")
          if (pkg.isEmpty()) continue
          out[pkg] = Rule(
            packageName = pkg,
            label = o.optString("label", pkg),
            limitMin = o.optInt("limitMin", 0).coerceAtLeast(0),
            allowExtend = o.optBoolean("allowExtend", true),
            pause = o.optBoolean("pause", false),
            blockInFocus = o.optBoolean("blockInFocus", false),
            maxOpens = o.optInt("maxOpens", 0).coerceAtLeast(0),
            checkInMin = o.optInt("checkInMin", 0).coerceAtLeast(0),
          )
        }
      } catch (_: Exception) {
        // Corrupt rules: behave as if there are none rather than crash the service.
      }
      return out
    }
  }
}
