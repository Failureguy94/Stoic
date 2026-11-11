package app.stoic.device

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class SchedulesTest {
  private val mon = 1
  private val tue = 2
  private val sun = 7
  private fun at(h: Int, m: Int = 0) = h * 60 + m

  private fun schedule(
    days: Set<Int> = (1..7).toSet(),
    start: Int = at(23),
    end: Int = at(7),
    allApps: Boolean = false,
    packages: Set<String> = setOf("yt"),
    enabled: Boolean = true,
    dnd: Boolean = false,
  ) = Schedule("s", "Bedtime", true, enabled, days, start, end, allApps, packages, dnd, true)

  @Test fun dayWindowIsActiveOnlyInsideIt() {
    val study = schedule(days = setOf(mon), start = at(9), end = at(17))
    assertFalse(Schedules.isActive(study, mon, at(8, 59)))
    assertTrue(Schedules.isActive(study, mon, at(9)))
    assertTrue(Schedules.isActive(study, mon, at(16, 59)))
    assertFalse(Schedules.isActive(study, mon, at(17)))
    assertFalse(Schedules.isActive(study, tue, at(10)))
  }

  @Test fun overnightWindowBelongsToTheDayItStarts() {
    // Monday night only: active Mon 23:00 until Tue 07:00.
    val bed = schedule(days = setOf(mon))
    assertTrue(Schedules.isActive(bed, mon, at(23, 30)))
    assertTrue(Schedules.isActive(bed, tue, at(6, 59)))
    assertFalse(Schedules.isActive(bed, tue, at(7)))
    assertFalse(Schedules.isActive(bed, mon, at(6))) // Sunday night is not selected
    assertFalse(Schedules.isActive(bed, tue, at(23, 30)))
  }

  @Test fun sundayNightRunsIntoMonday() {
    val bed = schedule(days = setOf(sun))
    assertTrue(Schedules.isActive(bed, mon, at(2)))
  }

  @Test fun sameStartAndEndMeansAllDay() {
    val allDay = schedule(days = setOf(mon), start = at(0), end = at(0))
    assertTrue(Schedules.isActive(allDay, mon, at(12)))
    assertFalse(Schedules.isActive(allDay, tue, at(12)))
  }

  @Test fun disabledOrNoDaysIsNeverActive() {
    assertFalse(Schedules.isActive(schedule(enabled = false), mon, at(23, 30)))
    assertFalse(Schedules.isActive(schedule(days = emptySet()), mon, at(23, 30)))
  }

  private fun blocks(s: Schedule, pkg: String, essential: Set<String> = emptySet(), allowed: Set<String> = emptySet()) =
    Schedules.blocking(listOf(s), pkg, mon, at(23, 30), essential, allowed) { it != "not-launchable" } != null

  @Test fun chosenAppsScheduleBlocksOnlyThoseApps() {
    val s = schedule(packages = setOf("yt"))
    assertTrue(blocks(s, "yt"))
    assertFalse(blocks(s, "maps"))
  }

  @Test fun allAppsScheduleRespectsAlwaysAllowedAndEssentials() {
    val s = schedule(allApps = true)
    assertTrue(blocks(s, "yt"))
    assertFalse(blocks(s, "maps", allowed = setOf("maps")))
    assertFalse(blocks(s, "dialer", essential = setOf("dialer")))
    assertFalse(blocks(s, "not-launchable"))
  }

  @Test fun essentialsWinEvenWhenChosen() {
    // Someone adds the phone app to a schedule: calls must still work.
    assertFalse(blocks(schedule(packages = setOf("dialer")), "dialer", essential = setOf("dialer")))
  }

  @Test fun outsideTheWindowNothingIsBlocked() {
    assertNull(Schedules.blocking(listOf(schedule()), "yt", mon, at(12), emptySet(), emptySet()) { true })
  }

  @Test fun dndFollowsSchedulesThatAskForIt() {
    assertTrue(Schedules.dndWanted(listOf(schedule(dnd = true)), mon, at(23, 30)))
    assertFalse(Schedules.dndWanted(listOf(schedule(dnd = true)), mon, at(12)))
    assertFalse(Schedules.dndWanted(listOf(schedule(dnd = false)), mon, at(23, 30)))
  }

  @Test fun parseReadsTheAppFormatAndSkipsBadEntries() {
    val json = """[
      {"id":"bed","name":"Bedtime","kind":"bedtime","enabled":true,"days":[1,2,9],"startMin":1380,"endMin":420,
       "allApps":true,"packages":[],"dnd":true,"allowSnooze":false},
      {"name":"no id"}
    ]"""
    val list = Schedules.parse(json)
    assertEquals(1, list.size)
    val s = list[0]
    assertTrue(s.isBedtime)
    assertEquals(setOf(1, 2), s.days)
    assertEquals(1380, s.startMin)
    assertTrue(s.dnd)
    assertFalse(s.allowSnooze)
  }

  @Test fun corruptJsonMeansNoSchedules() = assertEquals(0, Schedules.parse("not json").size)
}
