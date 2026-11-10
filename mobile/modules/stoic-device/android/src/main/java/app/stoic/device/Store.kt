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

  var logEnabled: Boolean
    get() = prefs.getBoolean("logEnabled", false)
    set(value) = prefs.edit().putBoolean("logEnabled", value).apply()

  fun graceUntil(pkg: String) = prefs.getLong("grace_$pkg", 0)
  fun setGraceUntil(pkg: String, until: Long) = prefs.edit().putLong("grace_$pkg", until).apply()

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
          )
        }
      } catch (_: Exception) {
        // Corrupt rules: behave as if there are none rather than crash the service.
      }
      return out
    }
  }
}
