package app.stoic.device

/**
 * The "should this app be interrupted right now?" decision.
 * Pure Kotlin with no Android imports, so it is unit-tested on the JVM
 * (src/test/.../BlockerTest.kt).
 */
data class Rule(
  val packageName: String,
  val label: String,
  /** Daily limit in minutes. 0 = no limit. */
  val limitMin: Int,
  /** Whether "5 more minutes" is offered on the time's-up screen. */
  val allowExtend: Boolean,
  /** Show a short pause before the app opens. */
  val pause: Boolean,
  /** Block while a focus session runs. */
  val blockInFocus: Boolean,
)

enum class Decision { ALLOW, FOCUS, SCHEDULE, LIMIT, PAUSE }

object Blocker {
  /** How long "Open anyway" lasts before the pause screen may show again. */
  const val GRACE_MS = 3 * 60_000L

  /** How much time "5 more minutes" adds. */
  const val EXTEND_MS = 5 * 60_000L

  /**
   * While the user is in an app they chose to "Open anyway", keep that choice alive.
   * Called when the app comes to the front and on every re-check. GRACE_MS is far longer
   * than the re-check interval, so an open app never sees the pause mid-use.
   * An expired grace is left expired: leaving and coming back later asks again.
   */
  fun refreshedGrace(graceUntil: Long, now: Long): Long = if (graceUntil > now) now + GRACE_MS else graceUntil

  /**
   * @param usedTodayMs foreground time for this app today, or null when Usage access is off
   *                    (then a daily limit cannot be checked and is skipped).
   * @param focusUntil  end of the running focus session, 0 if none.
   * @param graceUntil  the user chose "Open anyway" and this has not expired yet.
   * @param extendUntil the user chose "5 more minutes" and this has not expired yet.
   * @param schedule    the Bedtime or other schedule blocking this app now (see Schedules.blocking), or null.
   * @param snoozeUntil the user chose "5 more minutes" on a schedule screen and this has not expired yet.
   */
  fun decide(
    rule: Rule?,
    now: Long,
    usedTodayMs: Long?,
    focusUntil: Long,
    graceUntil: Long,
    extendUntil: Long,
    schedule: Schedule? = null,
    snoozeUntil: Long = 0,
  ): Decision {
    // A focus session is the strictest rule: the user started it on purpose.
    if (rule != null && rule.blockInFocus && focusUntil > now) return Decision.FOCUS
    // A schedule applies even to apps without their own rule (e.g. Bedtime blocking "all apps").
    if (schedule != null && snoozeUntil <= now) return Decision.SCHEDULE
    if (rule == null) return Decision.ALLOW
    if (rule.limitMin > 0 && usedTodayMs != null && usedTodayMs >= rule.limitMin * 60_000L && extendUntil <= now) {
      return Decision.LIMIT
    }
    if (rule.pause && graceUntil <= now) return Decision.PAUSE
    return Decision.ALLOW
  }
}
