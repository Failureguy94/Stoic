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

  @Test fun graceIsRefreshedWhileStillActive() {
    // Grace with 5 s left (less than one 20 s re-check) is renewed to a full GRACE_MS.
    assertEquals(now + Blocker.GRACE_MS, Blocker.refreshedGrace(now + 5_000, now))
  }

  @Test fun expiredGraceIsNotRevived() {
    assertEquals(now, Blocker.refreshedGrace(now, now))
    assertEquals(0L, Blocker.refreshedGrace(0, now))
  }

  private val bedtime = Schedule("bed", "Bedtime", true, true, (1..7).toSet(), 0, 0, true, emptySet(), false, true)

  @Test fun scheduleBlocksAppsWithoutTheirOwnRule() =
    assertEquals(Decision.SCHEDULE, Blocker.decide(null, now, 0, 0, 0, 0, schedule = bedtime))

  @Test fun scheduleWinsOverLimitAndPauseButNotFocus() {
    assertEquals(Decision.SCHEDULE, Blocker.decide(rule(limit = 1, pause = true), now, 10 * min, 0, 0, 0, schedule = bedtime))
    assertEquals(Decision.FOCUS, Blocker.decide(rule(focus = true), now, 0, now + min, 0, 0, schedule = bedtime))
  }

  @Test fun snoozeLiftsTheScheduleUntilItExpires() {
    assertEquals(Decision.ALLOW, Blocker.decide(null, now, 0, 0, 0, 0, schedule = bedtime, snoozeUntil = now + 1))
    assertEquals(Decision.SCHEDULE, Blocker.decide(null, now, 0, 0, 0, 0, schedule = bedtime, snoozeUntil = now))
  }

  @Test fun snoozedScheduleFallsBackToTheAppsOwnRule() =
    assertEquals(Decision.PAUSE, Blocker.decide(rule(pause = true), now, 0, 0, 0, 0, schedule = bedtime, snoozeUntil = now + 1))

  private fun opensRule(max: Int = 5, pause: Boolean = false) = Rule("com.example.app", "Example", 0, true, pause, false, maxOpens = max)

  @Test fun opensAreAllowedUntilTheMaximum() {
    assertEquals(Decision.ALLOW, Blocker.decide(opensRule(), now, 0, 0, 0, 0, opensToday = 4))
    assertEquals(Decision.OPENS, Blocker.decide(opensRule(), now, 0, 0, 0, 0, opensToday = 5))
  }

  @Test fun openOnceMoreAllowsOneMore() {
    assertEquals(Decision.ALLOW, Blocker.decide(opensRule(), now, 0, 0, 0, 0, opensToday = 5, extraOpens = 1))
    assertEquals(Decision.OPENS, Blocker.decide(opensRule(), now, 0, 0, 0, 0, opensToday = 6, extraOpens = 1))
  }

  @Test fun opensAreOnlyCheckedOnANewOpen() =
    assertEquals(Decision.ALLOW, Blocker.decide(opensRule(), now, 0, 0, 0, 0, opensToday = null))

  @Test fun opensLimitComesBeforeThePause() =
    assertEquals(Decision.OPENS, Blocker.decide(opensRule(pause = true), now, 0, 0, 0, 0, opensToday = 5))

  @Test fun checkInAfterMinutesInARow() {
    val r = Rule("com.example.app", "Example", 0, true, false, false, checkInMin = 20)
    assertEquals(Decision.ALLOW, Blocker.decide(r, now, 0, 0, 0, 0, sessionMs = 19 * min))
    assertEquals(Decision.CHECKIN, Blocker.decide(r, now, 0, 0, 0, 0, sessionMs = 20 * min))
  }

  @Test fun dailyLimitWinsOverCheckIn() {
    val r = Rule("com.example.app", "Example", 30, true, false, false, checkInMin = 20)
    assertEquals(Decision.LIMIT, Blocker.decide(r, now, 30 * min, 0, 0, 0, sessionMs = 25 * min))
  }

  @Test fun quickReturnIsTheSameVisit() {
    assertEquals(false, Blocker.isNewOpen(lastUsedAt = now - 10_000, now = now))
    assertEquals(true, Blocker.isNewOpen(lastUsedAt = now - 60_000, now = now))
    assertEquals(true, Blocker.isNewOpen(lastUsedAt = 0, now = now))
  }
}
