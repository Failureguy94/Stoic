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

enum class Decision { ALLOW, FOCUS, LIMIT, PAUSE }

object Blocker {
  /** How long "Open anyway" lasts before the pause screen may show again. */
  const val GRACE_MS = 3 * 60_000L

  /** How much time "5 more minutes" adds. */
  const val EXTEND_MS = 5 * 60_000L

  /**
   * @param usedTodayMs foreground time for this app today, or null when Usage access is off
   *                    (then a daily limit cannot be checked and is skipped).
   * @param focusUntil  end of the running focus session, 0 if none.
   * @param graceUntil  the user chose "Open anyway" and this has not expired yet.
   * @param extendUntil the user chose "5 more minutes" and this has not expired yet.
   */
  fun decide(
    rule: Rule?,
    now: Long,
    usedTodayMs: Long?,
    focusUntil: Long,
    graceUntil: Long,
    extendUntil: Long,
  ): Decision {
    if (rule == null) return Decision.ALLOW
    // A focus session is the strictest rule: the user started it on purpose.
    if (rule.blockInFocus && focusUntil > now) return Decision.FOCUS
    if (rule.limitMin > 0 && usedTodayMs != null && usedTodayMs >= rule.limitMin * 60_000L && extendUntil <= now) {
      return Decision.LIMIT
    }
    if (rule.pause && graceUntil <= now) return Decision.PAUSE
    return Decision.ALLOW
  }
}
