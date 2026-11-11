package app.stoic.device

/**
 * Decisions for notification control. Pure Kotlin, unit-tested in NotifyRulesTest.kt.
 */
enum class NotifyAction { SHOW, HOLD }

data class NotifyInfo(
  val pkg: String,
  /** Ongoing or foreground-service notifications: music, navigation, downloads, calls in progress. */
  val ongoing: Boolean,
  /** Notification.category, e.g. "call", "alarm", "msg". */
  val category: String?,
)

object NotifyRules {
  /** Categories STOIC never holds: you must always see calls, alarms, navigation and similar. */
  val NEVER_HOLD = setOf("call", "alarm", "navigation", "transport", "sys", "service", "progress", "stopwatch", "reminder")

  /**
   * @param holdApps        apps the user chose to hold for the summary.
   * @param holdWhileBlocked also hold notifications from apps that are blocked right now (focus, bedtime, schedules).
   * @param blockedNow      this app is blocked right now.
   * @param essential       phone, messages, alarm clock and similar (Essentials.kt): never held.
   */
  fun decide(
    info: NotifyInfo,
    ownPkg: String,
    holdApps: Set<String>,
    holdWhileBlocked: Boolean,
    blockedNow: Boolean,
    essential: Boolean,
  ): NotifyAction {
    if (info.pkg == ownPkg || essential || info.ongoing) return NotifyAction.SHOW
    if (info.category != null && info.category in NEVER_HOLD) return NotifyAction.SHOW
    if (info.pkg in holdApps) return NotifyAction.HOLD
    if (holdWhileBlocked && blockedNow) return NotifyAction.HOLD
    return NotifyAction.SHOW
  }

  /**
   * The most recent summary time at or before `now`, as epoch ms, or null if there are no times.
   * @param todayStart local midnight of the day containing `now`.
   * @param times      minutes after midnight, e.g. 13:00 = 780.
   */
  fun latestSlot(times: List<Int>, todayStart: Long, now: Long): Long? {
    if (times.isEmpty()) return null
    val day = 24 * 60 * 60_000L
    return times.flatMap { listOf(todayStart + it * 60_000L, todayStart - day + it * 60_000L) }
      .filter { it <= now }
      .maxOrNull()
  }

  /**
   * Should a summary go out now? Once per slot, and only if something was held
   * after the last summary and by the time of this slot.
   */
  fun summaryDue(times: List<Int>, todayStart: Long, now: Long, lastSummaryAt: Long, heldAt: List<Long>): Boolean {
    val slot = latestSlot(times, todayStart, now) ?: return false
    return lastSummaryAt < slot && heldAt.any { it in (lastSummaryAt + 1)..slot }
  }
}
