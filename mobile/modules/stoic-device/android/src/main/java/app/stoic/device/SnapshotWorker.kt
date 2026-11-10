package app.stoic.device

import android.content.Context
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.Worker
import androidx.work.WorkerParameters
import java.util.concurrent.TimeUnit

/** Background job: every few hours, copy recent usage into STOIC's own log and leave a heartbeat. */
class SnapshotWorker(context: Context, params: WorkerParameters) : Worker(context, params) {
  override fun doWork(): Result {
    return try {
      UsageLog.record(applicationContext)
      Result.success()
    } catch (_: Exception) {
      Result.retry()
    }
  }

  companion object {
    private const val NAME = "stoic-usage-snapshot"

    fun schedule(context: Context) {
      val request = PeriodicWorkRequestBuilder<SnapshotWorker>(4, TimeUnit.HOURS).build()
      WorkManager.getInstance(context).enqueueUniquePeriodicWork(NAME, ExistingPeriodicWorkPolicy.KEEP, request)
    }

    fun cancel(context: Context) {
      WorkManager.getInstance(context).cancelUniqueWork(NAME)
    }
  }
}
