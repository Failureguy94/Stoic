package app.stoic.device

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import java.util.concurrent.ConcurrentHashMap

/**
 * Notification control: counts notifications per app, holds the ones the user chose
 * (or from apps blocked right now) and sends one summary at the user's chosen times
 * or when a focus session or schedule ends.
 *
 * Privacy: held notifications (app, title, text) are kept only in STOIC's private
 * storage on this phone and deleted when opened, cleared, or after three days.
 */
class StoicNotificationListener : NotificationListenerService() {
  private lateinit var store: Store
  private lateinit var blocks: BlockState
  private val handler = Handler(Looper.getMainLooper())

  private val minuteTick = object : Runnable {
    override fun run() {
      try {
        checkSummary()
      } catch (e: Exception) {
        // Never let a summary problem stop the listener, but leave a trace.
        Log.w(TAG, "summary check failed", e)
      }
      handler.postDelayed(this, 60_000L)
    }
  }

  override fun onListenerConnected() {
    store = Store(this)
    blocks = BlockState(this, store)
    handler.removeCallbacks(minuteTick)
    handler.post(minuteTick)
  }

  override fun onListenerDisconnected() {
    handler.removeCallbacks(minuteTick)
  }

  override fun onNotificationPosted(sbn: StatusBarNotification) {
    if (!::store.isInitialized) return
    val pkg = sbn.packageName
    if (pkg == packageName) return
    val n = sbn.notification
    val ongoing = sbn.isOngoing || (n.flags and Notification.FLAG_FOREGROUND_SERVICE) != 0
    val summary = (n.flags and Notification.FLAG_GROUP_SUMMARY) != 0
    val now = System.currentTimeMillis()

    // Count real notifications only: not group headers, not ongoing ones, not silent updates.
    val update = (n.flags and Notification.FLAG_ONLY_ALERT_ONCE) != 0 && seen.contains(sbn.key)
    if (!ongoing && !summary && !update) HeldLog.count(this, UsageReader.dayKey(UsageReader.dayStart(0)), pkg)
    if (seen.size > 2_000) seen.clear() // only needed to spot updates of recent notifications
    seen.add(sbn.key)

    val blockedNow = blocks.isBlocked(pkg, now)
    val action = NotifyRules.decide(
      NotifyInfo(pkg, ongoing, n.category), packageName, store.holdApps(), store.holdWhileBlocked,
      blockedNow, pkg in blocks.essentials(),
    )
    if (action != NotifyAction.HOLD) return

    if (!summary) {
      val extras = n.extras
      val secret = n.visibility == Notification.VISIBILITY_SECRET
      HeldLog.add(
        this,
        HeldLog.Item(
          key = sbn.key,
          pkg = pkg,
          label = appLabel(this, pkg),
          title = if (secret) "" else extras.getCharSequence(Notification.EXTRA_TITLE)?.toString().orEmpty(),
          text = if (secret) "" else extras.getCharSequence(Notification.EXTRA_TEXT)?.toString().orEmpty(),
          postedAt = now,
          reason = if (pkg in store.holdApps()) "app" else "blocked",
        ),
      )
      n.contentIntent?.let { pending[sbn.key] = it }
    }
    cancelNotification(sbn.key)
  }

  /** Summary at the chosen times, or as soon as a focus session or schedule ends. */
  private fun checkSummary() {
    val now = System.currentTimeMillis()
    val held = HeldLog.list(this)
    val active = blocks.anyActive(now)
    val blockEnded = store.blockWasActive && !active
    store.blockWasActive = active

    val unannounced = held.filter { it.postedAt > store.lastSummaryAt }
    val due = NotifyRules.summaryDue(store.summaryTimes(), UsageReader.dayStart(0), now, store.lastSummaryAt, held.map { it.postedAt }) ||
      (blockEnded && unannounced.any { it.reason == "blocked" })
    if (!due || unannounced.isEmpty()) return
    postSummary(unannounced, if (blockEnded) R.string.stoic_summary_title_after_block else R.string.stoic_summary_title)
    store.lastSummaryAt = now
  }

  private fun postSummary(items: List<HeldLog.Item>, titleRes: Int) {
    val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    nm.createNotificationChannel(
      NotificationChannel(SUMMARY_CHANNEL, getString(R.string.stoic_summary_channel), NotificationManager.IMPORTANCE_DEFAULT),
    )
    val byApp = items.groupingBy { it.label }.eachCount().entries.sortedByDescending { it.value }
    val text = byApp.joinToString(", ") { "${it.key} ${it.value}" }
    val open = PendingIntent.getActivity(
      this, 0,
      Intent(Intent.ACTION_VIEW, Uri.parse("stoic://notifications")).setPackage(packageName).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
      PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
    )
    val notification = NotificationCompat.Builder(this, SUMMARY_CHANNEL)
      .setSmallIcon(R.drawable.stoic_notification)
      .setContentTitle(getString(titleRes, items.size))
      .setContentText(text)
      .setStyle(NotificationCompat.BigTextStyle().bigText(text))
      .setContentIntent(open)
      .setAutoCancel(true)
      .build()
    try {
      NotificationManagerCompat.from(this).notify(SUMMARY_ID, notification)
    } catch (e: SecurityException) {
      // Notification permission is off: the held list is still in STOIC.
      Log.i(TAG, "summary not shown: notification permission is off")
    }
  }

  override fun onDestroy() {
    handler.removeCallbacks(minuteTick)
    super.onDestroy()
  }

  companion object {
    private const val TAG = "StoicNotify"
    private const val SUMMARY_CHANNEL = "stoic_summary"
    private const val SUMMARY_ID = 4201

    /** Tap targets of held notifications, while STOIC is running. Not saved: they cannot be. */
    val pending = ConcurrentHashMap<String, PendingIntent>()
    private val seen: MutableSet<String> = ConcurrentHashMap.newKeySet()

    fun appLabel(context: Context, pkg: String): String = try {
      val pm = context.packageManager
      pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString()
    } catch (_: Exception) {
      pkg
    }

    fun isEnabled(context: Context): Boolean =
      NotificationManagerCompat.getEnabledListenerPackages(context).contains(context.packageName)

    fun component(context: Context) = ComponentName(context, StoicNotificationListener::class.java)
  }
}
