package app.stoic.device

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class StrictTest {
  private fun rule(
    limit: Int = 30,
    opens: Int = 10,
    checkIn: Int = 20,
    pause: Boolean = true,
    focus: Boolean = true,
    extend: Boolean = false,
  ) = mapOf("yt" to Rule("yt", "YouTube", limit, extend, pause, focus, opens, checkIn))

  @Test fun sameRulesAreFine() = assertNull(Strict.looserRules(rule(), rule()))

  @Test fun strongerRulesAreFine() {
    assertNull(Strict.looserRules(rule(limit = 30), rule(limit = 15)))
    assertNull(Strict.looserRules(rule(opens = 10), rule(opens = 5)))
    assertNull(Strict.looserRules(rule(limit = 0), rule(limit = 60))) // adding a limit
    assertNull(Strict.looserRules(rule(), rule() + mapOf("ig" to Rule("ig", "Instagram", 0, true, true, false))))
  }

  @Test fun looserRulesAreCaught() {
    assertNotNull(Strict.looserRules(rule(), emptyMap()))
    assertNotNull(Strict.looserRules(rule(limit = 30), rule(limit = 60)))
    assertNotNull(Strict.looserRules(rule(limit = 30), rule(limit = 0)))
    assertNotNull(Strict.looserRules(rule(opens = 10), rule(opens = 0)))
    assertNotNull(Strict.looserRules(rule(checkIn = 20), rule(checkIn = 30)))
    assertNotNull(Strict.looserRules(rule(pause = true), rule(pause = false)))
    assertNotNull(Strict.looserRules(rule(focus = true), rule(focus = false)))
    assertNotNull(Strict.looserRules(rule(extend = false), rule(extend = true)))
  }

  private fun sched(
    enabled: Boolean = true,
    days: Set<Int> = setOf(1, 2, 3),
    start: Int = 540,
    end: Int = 1020,
    all: Boolean = false,
    pkgs: Set<String> = setOf("yt"),
    dnd: Boolean = true,
    snooze: Boolean = false,
  ) = listOf(Schedule("s", "Study hours", false, enabled, days, start, end, all, pkgs, dnd, snooze))

  @Test fun strongerSchedulesAreFine() {
    assertNull(Strict.looserSchedules(sched(), sched()))
    assertNull(Strict.looserSchedules(sched(days = setOf(1)), sched(days = setOf(1, 2))))
    assertNull(Strict.looserSchedules(sched(pkgs = setOf("yt")), sched(pkgs = setOf("yt", "ig"))))
    assertNull(Strict.looserSchedules(sched(all = false), sched(all = true)))
    // A schedule that was off may be changed freely.
    assertNull(Strict.looserSchedules(sched(enabled = false), sched(enabled = false, start = 0)))
  }

  @Test fun looserSchedulesAreCaught() {
    assertNotNull(Strict.looserSchedules(sched(), emptyList()))
    assertNotNull(Strict.looserSchedules(sched(), sched(enabled = false)))
    assertNotNull(Strict.looserSchedules(sched(), sched(days = setOf(1, 2))))
    assertNotNull(Strict.looserSchedules(sched(), sched(end = 900)))
    assertNotNull(Strict.looserSchedules(sched(all = true), sched(all = false)))
    assertNotNull(Strict.looserSchedules(sched(), sched(pkgs = emptySet())))
    assertNotNull(Strict.looserSchedules(sched(), sched(dnd = false)))
    assertNotNull(Strict.looserSchedules(sched(), sched(snooze = true)))
  }

  @Test fun alwaysAllowedCanOnlyShrink() {
    assertNull(Strict.looserAllowed(setOf("maps", "bank"), setOf("maps")))
    assertNotNull(Strict.looserAllowed(setOf("maps"), setOf("maps", "yt")))
  }

  @Test fun focusCannotEndEarly() {
    val now = 1_000_000L
    assertNotNull(Strict.looserFocus(oldUntil = now + 60_000, newUntil = 0, now = now))
    assertNull(Strict.looserFocus(oldUntil = now + 60_000, newUntil = now + 120_000, now = now))
    assertNull(Strict.looserFocus(oldUntil = 0, newUntil = now + 60_000, now = now))
  }

  @Test fun strictCanBeExtendedButNotShortened() {
    val now = 1_000L
    assertEquals(5_000L, Strict.newUntil(currentUntil = 5_000, requested = 2_000, now = now))
    assertEquals(9_000L, Strict.newUntil(currentUntil = 5_000, requested = 9_000, now = now))
    assertEquals(2_000L, Strict.newUntil(currentUntil = 500, requested = 2_000, now = now)) // was off
  }

  @Test fun unlockEarlyNeedsTheWait() {
    val asked = 1_000_000L
    assertFalse(Strict.canUnlockEarly(0, asked + Strict.UNLOCK_WAIT_MS))
    assertFalse(Strict.canUnlockEarly(asked, asked + Strict.UNLOCK_WAIT_MS - 1))
    assertTrue(Strict.canUnlockEarly(asked, asked + Strict.UNLOCK_WAIT_MS))
  }

  @Test fun systemScreensCovered() {
    val installers = setOf("installer")
    val settings = setOf("settings")
    assertTrue(Strict.blocksSystemApp("installer", lockSettings = false, installers, settings))
    assertFalse(Strict.blocksSystemApp("settings", lockSettings = false, installers, settings))
    assertTrue(Strict.blocksSystemApp("settings", lockSettings = true, installers, settings))
    assertFalse(Strict.blocksSystemApp("yt", lockSettings = true, installers, settings))
  }

  private val sites = SiteSettings(enabled = true, sites = setOf("youtube.com", "reddit.com"), always = true, internetOff = true)

  @Test fun sitesCanOnlyGetStricter() {
    assertNull(Strict.looserSites(sites, sites))
    assertNull(Strict.looserSites(sites, sites.copy(sites = sites.sites + "x.com")))
    assertNull(Strict.looserSites(Sites.OFF, sites))
    assertNotNull(Strict.looserSites(sites, sites.copy(enabled = false)))
    assertNotNull(Strict.looserSites(sites, sites.copy(sites = setOf("youtube.com"))))
    assertNotNull(Strict.looserSites(sites, sites.copy(always = false)))
    assertNotNull(Strict.looserSites(sites, sites.copy(internetOff = false)))
  }
}
