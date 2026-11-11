package app.stoic.device

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.provider.AlarmClock
import android.provider.Settings
import android.provider.Telephony
import android.telecom.TelecomManager

/**
 * Apps a schedule must never block, found by asking Android which app handles each job,
 * so it works on every phone brand: phone calls, text messages, the alarm clock,
 * the home screen, Settings and STOIC itself.
 */
object Essentials {
  fun packages(context: Context): Set<String> {
    val pm = context.packageManager
    val out = HashSet<String>()
    out.add(context.packageName)
    out.add("com.android.systemui")
    try {
      (context.getSystemService(Context.TELECOM_SERVICE) as? TelecomManager)?.defaultDialerPackage?.let(out::add)
    } catch (_: Exception) {}
    try {
      Telephony.Sms.getDefaultSmsPackage(context)?.let(out::add)
    } catch (_: Exception) {}
    fun handlers(intent: Intent) = try {
      pm.queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY).map { it.activityInfo.packageName }
    } catch (_: Exception) {
      emptyList()
    }
    out.addAll(handlers(Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)))
    out.addAll(handlers(Intent(AlarmClock.ACTION_SHOW_ALARMS)))
    out.addAll(handlers(Intent(Settings.ACTION_SETTINGS)))
    out.addAll(handlers(Intent(Intent.ACTION_DIAL)))
    return out
  }
}

/** System apps strict mode covers: the app installer/uninstaller, and Settings. */
object SystemApps {
  private fun handlers(context: Context, intent: Intent): Set<String> = try {
    context.packageManager.queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY)
      .map { it.activityInfo.packageName }.toSet()
  } catch (_: Exception) {
    emptySet()
  }

  fun installers(context: Context): Set<String> =
    handlers(context, Intent(Intent.ACTION_DELETE, android.net.Uri.parse("package:${context.packageName}"))) +
      handlers(context, Intent(Intent.ACTION_UNINSTALL_PACKAGE, android.net.Uri.parse("package:${context.packageName}")))

  fun settings(context: Context): Set<String> = handlers(context, Intent(Settings.ACTION_SETTINGS))
}

/** A readable name for system apps that have no home-screen icon (e.g. the uninstall screen). */
object SystemAppsLabel {
  fun of(context: Context, pkg: String): String = try {
    val pm = context.packageManager
    pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString()
  } catch (_: Exception) {
    pkg
  }
}

/** Do Not Disturb, for Bedtime. Only ever switched off again if STOIC switched it on. */
object Dnd {
  fun hasAccess(context: Context): Boolean =
    (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).isNotificationPolicyAccessGranted

  /** Bring DND in line with the schedules. Safe to call often. */
  fun sync(context: Context, store: Store, wanted: Boolean) {
    if (!hasAccess(context)) return
    val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    try {
      if (wanted && !store.dndOnByStoic) {
        // Only take over if DND is off; never override a mode the user set themselves.
        if (nm.currentInterruptionFilter == NotificationManager.INTERRUPTION_FILTER_ALL) {
          // "Priority only": alarms and the people the user allowed in DND settings still get through.
          nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_PRIORITY)
          store.dndOnByStoic = true
        }
      } else if (!wanted && store.dndOnByStoic) {
        // If the user changed DND themselves in the meantime, leave it alone.
        if (nm.currentInterruptionFilter == NotificationManager.INTERRUPTION_FILTER_PRIORITY) {
          nm.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_ALL)
        }
        store.dndOnByStoic = false
      }
    } catch (_: SecurityException) {
      // Access was withdrawn between the check and the call.
    }
  }
}
