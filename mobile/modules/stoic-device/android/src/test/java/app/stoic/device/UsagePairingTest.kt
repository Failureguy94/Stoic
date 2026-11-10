package app.stoic.device

import app.stoic.device.UsageReader.Ev
import org.junit.Assert.assertEquals
import org.junit.Test

class UsagePairingTest {
  private val begin = 1_000L
  private val end = 10_000L
  private fun pair(vararg evs: Ev) = UsageReader.pairEvents(evs.toList(), begin, end)

  @Test fun resumeThenPauseCountsTheGap() =
    assertEquals(mapOf("a" to 2_000L), pair(Ev("a", 2_000, true), Ev("a", 4_000, false)))

  @Test fun appOpenAtTheStartIsCountedFromTheStart() =
    assertEquals(mapOf("a" to 500L), pair(Ev("a", 1_500, false)))

  @Test fun appStillOpenAtTheEndIsCountedToTheEnd() =
    assertEquals(mapOf("a" to 1_000L), pair(Ev("a", 9_000, true)))

  @Test fun pauseFollowedByStopIsNotCountedTwice() =
    assertEquals(mapOf("a" to 1_000L), pair(Ev("a", 2_000, true), Ev("a", 3_000, false), Ev("a", 3_200, false)))

  @Test fun twoAppsAreKeptApart() =
    assertEquals(
      mapOf("a" to 1_000L, "b" to 3_000L),
      pair(Ev("a", 2_000, true), Ev("a", 3_000, false), Ev("b", 3_000, true), Ev("b", 6_000, false)),
    )

  @Test fun movingBetweenScreensOfOneAppAddsUp() =
    assertEquals(
      mapOf("a" to 4_000L),
      pair(Ev("a", 2_000, true), Ev("a", 4_000, false), Ev("a", 4_000, true), Ev("a", 6_000, false)),
    )

  @Test fun noEventsMeansNoUsage() = assertEquals(emptyMap<String, Long>(), pair())
}
