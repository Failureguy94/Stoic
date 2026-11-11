package app.stoic.device

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class ReelsTest {
  private val yt = Reels.YOUTUBE
  private val ig = Reels.INSTAGRAM
  private fun ids(pkg: String, vararg names: String) = names.map { "$pkg:id/$it" }.asSequence()

  @Test fun youtubeShortsPlayerIsRecognised() {
    assertTrue(Reels.isShortForm(yt, ids(yt, "toolbar", "reel_recycler")))
    assertTrue(Reels.isShortForm(yt, ids(yt, "reel_player_page_container")))
    assertTrue(Reels.isShortForm(yt, ids(yt, "reel_watch_player")))
  }

  @Test fun youtubeHomeAndVideosAreNot() {
    // The Shorts row on the home feed is fine to scroll past; only the full-screen player counts.
    assertFalse(Reels.isShortForm(yt, ids(yt, "results", "reel_shelf_item", "reel_shelf_header")))
    assertFalse(Reels.isShortForm(yt, ids(yt, "watch_player", "player_view", "video_title")))
  }

  @Test fun instagramReelsViewerIsRecognised() {
    assertTrue(Reels.isShortForm(ig, ids(ig, "clips_viewer_view_pager")))
    assertTrue(Reels.isShortForm(ig, ids(ig, "clips_video_container")))
  }

  @Test fun instagramFeedAndMessagesAreNot() {
    assertFalse(Reels.isShortForm(ig, ids(ig, "row_feed_photo_imageview", "direct_thread_list", "clips_netego_item")))
  }

  @Test fun idsFromOtherPackagesNeverMatch() {
    // An id has to belong to the app itself: "android:id/reel_recycler" or another app's ids don't count.
    assertFalse(Reels.isShortForm(yt, sequenceOf("android:id/reel_recycler", "$ig:id/reel_recycler")))
    assertFalse(Reels.isShortForm("com.other.app", ids("com.other.app", "reel_recycler")))
    assertFalse(Reels.isShortForm(yt, sequenceOf(null, null)))
  }

  @Test fun localNameStripsThePackage() {
    assertEquals("reel_recycler", Reels.localName(yt, "$yt:id/reel_recycler"))
    assertNull(Reels.localName(yt, "android:id/content"))
    assertNull(Reels.localName(yt, null))
  }

  @Test fun eachAppHasItsOwnSwitch() {
    assertTrue(Reels.blocking(yt, youtubeOn = true, instagramOn = false))
    assertFalse(Reels.blocking(ig, youtubeOn = true, instagramOn = false))
    assertTrue(Reels.blocking(ig, youtubeOn = false, instagramOn = true))
    assertFalse(Reels.blocking("com.other.app", youtubeOn = true, instagramOn = true))
  }
}
