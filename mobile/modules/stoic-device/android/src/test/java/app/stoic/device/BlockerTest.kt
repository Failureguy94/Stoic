package app.stoic.device

import org.junit.Assert.assertEquals
import org.junit.Test

class BlockerTest {
  private val now = 1_000_000_000L
  private val min = 60_000L
  private fun rule(limit: Int = 0, pause: Boolean = false, focus: Boolean = false, extend: Boolean = true) =
    Rule("com.example.app", "Example", limit, extend, pause, focus)

  private fun decide(rule: Rule?, used: Long? = 0, focusUntil: Long = 0, grace: Long = 0, extend: Long = 0) =
    Blocker.decide(rule, now, used, focusUntil, grace, extend)

  @Test fun appWithoutRuleIsAllowed() = assertEquals(Decision.ALLOW, decide(null))

  @Test fun ruleWithNothingSwitchedOnIsAllowed() = assertEquals(Decision.ALLOW, decide(rule()))

  @Test fun underTheLimitIsAllowed() = assertEquals(Decision.ALLOW, decide(rule(limit = 30), used = 29 * min))

  @Test fun reachingTheLimitBlocks() = assertEquals(Decision.LIMIT, decide(rule(limit = 30), used = 30 * min))

  @Test fun fiveMoreMinutesLiftsTheLimitUntilItExpires() {
    assertEquals(Decision.ALLOW, decide(rule(limit = 30), used = 31 * min, extend = now + 1))
    assertEquals(Decision.LIMIT, decide(rule(limit = 30), used = 36 * min, extend = now))
  }

  @Test fun limitIsSkippedWhenUsageAccessIsOff() = assertEquals(Decision.ALLOW, decide(rule(limit = 30), used = null))

  @Test fun pauseShowsUntilOpenAnywayIsChosen() {
    assertEquals(Decision.PAUSE, decide(rule(pause = true)))
    assertEquals(Decision.ALLOW, decide(rule(pause = true), grace = now + Blocker.GRACE_MS))
    assertEquals(Decision.PAUSE, decide(rule(pause = true), grace = now))
  }

  @Test fun focusSessionBlocksOnlyChosenApps() {
    assertEquals(Decision.FOCUS, decide(rule(focus = true), focusUntil = now + min))
    assertEquals(Decision.ALLOW, decide(rule(focus = false), focusUntil = now + min))
    assertEquals(Decision.ALLOW, decide(rule(focus = true), focusUntil = now))
  }

  @Test fun focusWinsOverLimitAndPause() =
    assertEquals(Decision.FOCUS, decide(rule(limit = 1, pause = true, focus = true), used = 10 * min, focusUntil = now + min))

  @Test fun limitWinsOverPause() =
    assertEquals(Decision.LIMIT, decide(rule(limit = 1, pause = true), used = 10 * min))

  @Test fun graceDoesNotBypassAFocusSessionOrALimit() {
    assertEquals(Decision.FOCUS, decide(rule(focus = true, pause = true), focusUntil = now + min, grace = now + min))
    assertEquals(Decision.LIMIT, decide(rule(limit = 1, pause = true), used = 5 * min, grace = now + min))
  }
}
