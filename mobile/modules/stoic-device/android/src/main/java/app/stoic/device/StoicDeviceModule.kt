package app.stoic.device

import android.app.ActivityOptions
import android.content.Context
import android.content.Intent
import android.net.VpnService
import android.os.Build
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

  /** Refuse a change that would loosen settings while strict mode is on. */
  private fun strictCheck(reason: String?) {
    if (reason != null) throw CodedException("ERR_STRICT", "Strict mode is on, so you can't $reason until it ends.", null)
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
      val store = Store(context)
      if (store.strictActive()) strictCheck(Strict.looserRules(store.rules(), Store.parseRules(json)))
      store.rulesJson = json
    }

    /** Opens counted today for each app with a rule: {packageName: count}. */
    Function("getOpensTodayJson") {
      val store = Store(context)
      val day = UsageReader.dayKey(UsageReader.dayStart(0))
      val o = JSONObject()
      store.rules().keys.forEach { o.put(it, store.opensToday(it, day)) }
      o.toString()
    }

    // ---- day score inputs ----
    /** Block-screen outcomes today: {wentBack, overrode}. */
    Function("getChoicesTodayJson") {
      val (wentBack, overrode) = Store(context).choicesToday(UsageReader.dayKey(UsageReader.dayStart(0)))
      JSONObject().put("wentBack", wentBack).put("overrode", overrode).toString()
    }

    /**
     * Phone use during the last finished Bedtime: {minutes, start, end}, or "null" when Bedtime is off
     * or has not run yet. Essential apps (phone, messages, alarm clock...) do not count.
     */
    AsyncFunction("getBedtimeUseJson") {
      val store = Store(context)
      val bed = store.schedules().firstOrNull { it.isBedtime && it.enabled } ?: return@AsyncFunction "null"
      val now = System.currentTimeMillis()
      val (isoDay, _) = StoicAccessibilityService.localTime(now)
      val (start, end) = Schedules.lastCompletedWindow(bed, now, UsageReader.dayStart(0), isoDay) ?: return@AsyncFunction "null"
      val essential = Essentials.packages(context)
      val ms = UsageReader.foregroundMs(context, start, end)
        .filter { (pkg, _) -> pkg !in essential && UsageReader.launchableLabel(context, pkg) != null }
        .values.sum()
      JSONObject().put("minutes", ms / 60_000.0).put("start", start).put("end", end).toString()
    }

    /** Every focus session reports its end here, so "during focus" settings (sites, internet off) follow it. */
    Function("setFocusSessionUntil") { untilMs: Double ->
      Store(context).focusSessionUntil = untilMs.toLong()
      StoicVpnService.sync(context)
    }

    Function("setFocusBlockUntil") { untilMs: Double ->
      val store = Store(context)
      val now = System.currentTimeMillis()
      if (store.strictActive(now)) strictCheck(Strict.looserFocus(store.focusUntil, untilMs.toLong(), now))
      store.focusUntil = untilMs.toLong()
      StoicVpnService.sync(context) // "Internet off" follows focus sessions
    }

    // ---- schedules and bedtime ----
    Function("getSchedulesJson") { Store(context).schedulesJson }

    Function("setSchedulesJson") { json: String ->
      JSONArray(json) // validate before saving so a bad value cannot break the service
      val store = Store(context)
      if (store.strictActive()) strictCheck(Strict.looserSchedules(store.schedules(), Schedules.parse(json)))
      store.schedulesJson = json
      // Apply Do Not Disturb straight away instead of waiting for the next minute.
      val (isoDay, minute) = StoicAccessibilityService.localTime(System.currentTimeMillis())
      Dnd.sync(context, store, Schedules.dndWanted(store.schedules(), isoDay, minute))
    }

    Function("getAlwaysAllowedJson") { Store(context).alwaysAllowedJson }

    Function("setAlwaysAllowedJson") { json: String ->
      JSONArray(json)
      val store = Store(context)
      if (store.strictActive()) strictCheck(Strict.looserAllowed(store.alwaysAllowed(), Schedules.parsePackages(json)))
      store.alwaysAllowedJson = json
    }

    // ---- website and internet blocking ----
    Function("getSitesJson") {
      val s = Sites.parse(Store(context).sitesJson)
      val arr = JSONArray()
      s.sites.sorted().forEach { arr.put(it) }
      JSONObject().put("enabled", s.enabled).put("sites", arr).put("always", s.always).put("internetOff", s.internetOff).toString()
    }

    Function("setSitesJson") { json: String ->
      val next = Sites.parse(json)
      val store = Store(context)
      if (store.strictActive()) strictCheck(Strict.looserSites(Sites.parse(store.sitesJson), next))
      store.sitesJson = json
      StoicVpnService.sync(context)
    }

    /** "youtube.com" from whatever was typed, or null if it isn't a website address. */
    Function("normalizeSite") { input: String -> Sites.normalize(input) }

    Function("isVpnAllowed") { StoicVpnService.consented(context) }

    Function("isVpnRunning") { StoicVpnService.running }

    /** Ask Android for permission to run STOIC's VPN (a system dialog). */
    Function("requestVpnPermission") {
      val intent = VpnService.prepare(context) ?: return@Function false
      val activity = appContext.currentActivity
      if (activity != null) activity.startActivityForResult(intent, 4711)
      else context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      true
    }

    // ---- strict mode ----
    Function("getStrictJson") {
      val store = Store(context)
      val now = System.currentTimeMillis()
      JSONObject()
        .put("until", if (store.strictActive(now)) store.strictUntil else 0)
        .put("lockSettings", store.strictLockSettings)
        .put("unlockRequestedAt", store.unlockRequestedAt)
        .put("unlockWaitMs", Strict.UNLOCK_WAIT_MS)
        .toString()
    }

    /** Start strict mode, or extend it. It can never be shortened this way. */
    Function("startStrict") { untilMs: Double, lockSettings: Boolean ->
      val store = Store(context)
      val now = System.currentTimeMillis()
      val wasActive = store.strictActive(now)
      store.strictUntil = Strict.newUntil(store.strictUntil, untilMs.toLong(), now)
      // Settings can be added to a running lock, not taken out of it.
      store.strictLockSettings = if (wasActive) store.strictLockSettings || lockSettings else lockSettings
      store.unlockRequestedAt = 0
    }

    Function("requestUnlock") {
      val store = Store(context)
      if (store.unlockRequestedAt == 0L) store.unlockRequestedAt = System.currentTimeMillis()
    }

    Function("cancelUnlock") { Store(context).unlockRequestedAt = 0 }

    /** Finish "Unlock early" once the wait is over. Returns false if it is too soon. */
    Function("unlockNow") {
      val store = Store(context)
      if (!Strict.canUnlockEarly(store.unlockRequestedAt, System.currentTimeMillis())) return@Function false
      store.strictUntil = 0
      store.unlockRequestedAt = 0
      true
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

    // ---- notification control ----
    Function("hasNotificationAccess") { StoicNotificationListener.isEnabled(context) }

    Function("openNotificationAccessSettings") {
      val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        Intent(Settings.ACTION_NOTIFICATION_LISTENER_DETAIL_SETTINGS)
          .putExtra(Settings.EXTRA_NOTIFICATION_LISTENER_COMPONENT_NAME, StoicNotificationListener.component(context).flattenToString())
      } else {
        Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
      }
      context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }

    /** Today's notifications per app, most first: [{packageName, label, count}]. */
    AsyncFunction("getNotificationCountsJson") {
      val arr = JSONArray()
      HeldLog.countsFor(context, UsageReader.dayKey(UsageReader.dayStart(0))).entries
        .sortedByDescending { it.value }
        .forEach {
          arr.put(
            JSONObject().put("packageName", it.key)
              .put("label", StoicNotificationListener.appLabel(context, it.key)).put("count", it.value),
          )
        }
      arr.toString()
    }

    AsyncFunction("getHeldJson") { HeldLog.toJson(HeldLog.list(context).sortedByDescending { it.postedAt }).toString() }

    /** Open a held notification as if it had been tapped (or its app, if that is no longer possible). */
    Function("openHeld") { key: String ->
      val item = HeldLog.list(context).firstOrNull { it.key == key }
      val pending = StoicNotificationListener.pending.remove(key)
      var opened = false
      if (pending != null) {
        opened = try {
          if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            @Suppress("DEPRECATION")
            val options = ActivityOptions.makeBasic()
              .setPendingIntentBackgroundActivityStartMode(ActivityOptions.MODE_BACKGROUND_ACTIVITY_START_ALLOWED)
            pending.send(context, 0, null, null, null, null, options.toBundle())
          } else {
            pending.send()
          }
          true
        } catch (_: Exception) {
          false
        }
      }
      if (!opened && item != null) {
        context.packageManager.getLaunchIntentForPackage(item.pkg)?.let {
          context.startActivity(it.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
          opened = true
        }
      }
      HeldLog.remove(context, key)
      opened
    }

    Function("clearHeld") {
      HeldLog.clear(context)
      StoicNotificationListener.pending.clear()
    }

    Function("getHoldAppsJson") { Store(context).holdAppsJson }

    Function("setHoldAppsJson") { json: String ->
      JSONArray(json)
      Store(context).holdAppsJson = json
    }

    Function("getHoldWhileBlocked") { Store(context).holdWhileBlocked }

    Function("setHoldWhileBlocked") { on: Boolean -> Store(context).holdWhileBlocked = on }

    Function("getSummaryTimesJson") { Store(context).summaryTimesJson }

    Function("setSummaryTimesJson") { json: String ->
      JSONArray(json)
      Store(context).summaryTimesJson = json
    }

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
