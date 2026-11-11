package app.stoic.device

import android.content.Context
import android.content.Intent
import android.provider.Settings
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONArray
import org.json.JSONObject

/**
 * Bridge between the React Native app and the Android-only features.
 * Lists and objects cross the bridge as JSON strings (parsed in src/lib/device.ts),
 * and times as Double, because JavaScript numbers are doubles.
 */
class StoicDeviceModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw CodedException("ERR_NO_CONTEXT", "Android context is not available", null)

  private fun open(action: String) {
    context.startActivity(Intent(action).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
  }

  private fun usageJson(usage: Map<String, Long>): JSONArray {
    val arr = JSONArray()
    usage.entries
      .mapNotNull { (pkg, ms) -> UsageReader.launchableLabel(context, pkg)?.let { Triple(pkg, it, ms) } }
      .filter { it.third >= 1_000 }
      .sortedByDescending { it.third }
      .forEach { arr.put(JSONObject().put("packageName", it.first).put("label", it.second).put("ms", it.third)) }
    return arr
  }

  override fun definition() = ModuleDefinition {
    Name("StoicDevice")

    // ---- screen time ----
    Function("hasUsageAccess") { UsageReader.hasAccess(context) }

    Function("openUsageAccessSettings") { open(Settings.ACTION_USAGE_ACCESS_SETTINGS) }

    AsyncFunction("getUsageTodayJson") {
      usageJson(UsageReader.foregroundMs(context, UsageReader.dayStart(0), System.currentTimeMillis())).toString()
    }

    AsyncFunction("getUsageByDayJson") { days: Int ->
      val out = JSONArray()
      val now = System.currentTimeMillis()
      for (daysAgo in 0 until days.coerceIn(1, 14)) {
        val start = UsageReader.dayStart(daysAgo)
        val end = if (daysAgo == 0) now else UsageReader.dayStart(daysAgo - 1)
        val apps = usageJson(UsageReader.foregroundMs(context, start, end))
        var total = 0L
        for (i in 0 until apps.length()) total += apps.getJSONObject(i).getLong("ms")
        out.put(JSONObject().put("day", UsageReader.dayKey(start)).put("totalMs", total).put("apps", apps))
      }
      out.toString()
    }

    AsyncFunction("getLaunchableAppsJson") {
      val arr = JSONArray()
      UsageReader.launchableApps(context).forEach { arr.put(JSONObject().put("packageName", it.first).put("label", it.second)) }
      arr.toString()
    }

    // ---- limits and pauses ----
    Function("isBlockerEnabled") { StoicAccessibilityService.isEnabled(context) }

    Function("openAccessibilitySettings") { open(Settings.ACTION_ACCESSIBILITY_SETTINGS) }

    Function("getRulesJson") { Store(context).rulesJson }

    Function("setRulesJson") { json: String ->
      // Validate before saving so a bad value cannot break the service.
      JSONArray(json)
      Store(context).rulesJson = json
    }

    Function("setFocusBlockUntil") { untilMs: Double -> Store(context).focusUntil = untilMs.toLong() }

    // ---- schedules and bedtime ----
    Function("getSchedulesJson") { Store(context).schedulesJson }

    Function("setSchedulesJson") { json: String ->
      JSONArray(json) // validate before saving so a bad value cannot break the service
      val store = Store(context)
      store.schedulesJson = json
      // Apply Do Not Disturb straight away instead of waiting for the next minute.
      val (isoDay, minute) = StoicAccessibilityService.localTime(System.currentTimeMillis())
      Dnd.sync(context, store, Schedules.dndWanted(store.schedules(), isoDay, minute))
    }

    Function("getAlwaysAllowedJson") { Store(context).alwaysAllowedJson }

    Function("setAlwaysAllowedJson") { json: String ->
      JSONArray(json)
      Store(context).alwaysAllowedJson = json
    }

    /** Apps schedules never block (phone, messages, alarm clock, home screen, Settings), with labels. */
    AsyncFunction("getEssentialAppsJson") {
      val arr = JSONArray()
      Essentials.packages(context)
        .mapNotNull { pkg -> UsageReader.launchableLabel(context, pkg)?.let { pkg to it } }
        .sortedBy { it.second.lowercase() }
        .forEach { arr.put(JSONObject().put("packageName", it.first).put("label", it.second)) }
      arr.toString()
    }

    Function("hasDndAccess") { Dnd.hasAccess(context) }

    Function("openDndAccessSettings") { open(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS) }

    // ---- STOIC's own usage log ----
    Function("isLogEnabled") { Store(context).logEnabled }

    Function("setLogEnabled") { enabled: Boolean ->
      Store(context).logEnabled = enabled
      if (enabled) SnapshotWorker.schedule(context) else SnapshotWorker.cancel(context)
    }

    AsyncFunction("recordSnapshotNow") { UsageLog.record(context) }

    AsyncFunction("getDayRecordsJson") { UsageLog.daysJson(context) }

    Function("getHeartbeatsJson") { UsageLog.heartbeatsJson(context) }
  }
}
