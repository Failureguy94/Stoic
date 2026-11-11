package app.stoic.device

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class NotifyRulesTest {
  private val me = "app.stoic.hub"
  private fun info(pkg: String = "insta", ongoing: Boolean = false, category: String? = null) = NotifyInfo(pkg, ongoing, category)
  private fun decide(
    info: NotifyInfo = info(),
    hold: Set<String> = emptySet(),
    whileBlocked: Boolean = false,
    blocked: Boolean = false,
    essential: Boolean = false,
  ) = NotifyRules.decide(info, me, hold, whileBlocked, blocked, essential)

  @Test fun notChosenAppsAreShown() = assertEquals(NotifyAction.SHOW, decide())

  @Test fun chosenAppsAreHeld() = assertEquals(NotifyAction.HOLD, decide(hold = setOf("insta")))

  @Test fun blockedAppsAreHeldOnlyWhenAskedFor() {
    assertEquals(NotifyAction.HOLD, decide(whileBlocked = true, blocked = true))
    assertEquals(NotifyAction.SHOW, decide(whileBlocked = false, blocked = true))
    assertEquals(NotifyAction.SHOW, decide(whileBlocked = true, blocked = false))
  }

  @Test fun callsAlarmsAndOngoingAreNeverHeld() {
    assertEquals(NotifyAction.SHOW, decide(info(category = "call"), hold = setOf("insta")))
    assertEquals(NotifyAction.SHOW, decide(info(category = "alarm"), hold = setOf("insta")))
    assertEquals(NotifyAction.SHOW, decide(info(ongoing = true), hold = setOf("insta")))
  }

  @Test fun essentialsAndStoicAreNeverHeld() {
    assertEquals(NotifyAction.SHOW, decide(hold = setOf("insta"), essential = true))
    assertEquals(NotifyAction.SHOW, decide(info(pkg = me), hold = setOf(me)))
  }

  @Test fun ordinaryMessagesCanBeHeld() =
    assertEquals(NotifyAction.HOLD, decide(info(category = "msg"), hold = setOf("insta")))

  private val day = 24 * 60 * 60_000L
  private val today = 100 * day
  private fun at(h: Int, m: Int = 0) = today + (h * 60 + m) * 60_000L

  @Test fun latestSlotIsTheLastTimeAlreadyReached() {
    val times = listOf(13 * 60, 19 * 60)
    assertEquals(at(13), NotifyRules.latestSlot(times, today, at(15)))
    assertEquals(at(19), NotifyRules.latestSlot(times, today, at(19)))
    // Before the first time today: yesterday's last one.
    assertEquals(at(19) - day, NotifyRules.latestSlot(times, today, at(9)))
    assertNull(NotifyRules.latestSlot(emptyList(), today, at(9)))
  }

  @Test fun summaryGoesOutOncePerSlotAndOnlyWithSomethingNew() {
    val times = listOf(13 * 60)
    fun due(now: Long, last: Long, vararg held: Long) = NotifyRules.summaryDue(times, today, now, last, held.toList())
    // Held at 10:00, now 13:01, last summary yesterday: due.
    assertTrue(due(at(13, 1), at(13) - day, at(10)))
    // Already sent at 13:00 today: not again.
    assertFalse(due(at(13, 5), at(13), at(10)))
    // Nothing held since the last summary: nothing to say.
    assertFalse(due(at(13, 1), at(11), at(10)))
    // Only held after the slot: waits for the next one.
    assertFalse(due(at(13, 30), at(12), at(13, 20)))
    // One before the slot and one after: the earlier one still gets its summary.
    assertTrue(due(at(13, 30), at(13) - day, at(10), at(13, 20)))
  }
}
