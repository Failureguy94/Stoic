package app.stoic.device

/**
 * Recognises YouTube Shorts and Instagram Reels from the *names* of the views on screen
 * (their resource ids), never from text. Pure Kotlin, unit-tested in ReelsTest.kt.
 *
 * YouTube names its Shorts player views "reel_…" (e.g. reel_recycler, reel_player_page_container),
 * Instagram names its Reels viewer "clips_…" (e.g. clips_viewer_view_pager). Matching on these
 * name patterns instead of exact ids keeps working across most app updates.
 */
object Reels {
  const val YOUTUBE = "com.google.android.youtube"
  const val INSTAGRAM = "com.instagram.android"
  val PACKAGES = setOf(YOUTUBE, INSTAGRAM)

  /** Full-screen Shorts player parts. Not "reel_shelf", which is the Shorts row on the home feed. */
  private val YOUTUBE_SHORTS = Regex("""^reel_(recycler|player|watch|pivot|time_bar|dyn_|progress)""")

  /** The full-screen Reels viewer. */
  private val INSTAGRAM_REELS = Regex("""^clips_(viewer|video_container|root|swipe|tab)""")

  /** The part after "package:id/", or null if the id is from another package (e.g. android:id/content). */
  fun localName(pkg: String, viewId: String?): String? {
    if (viewId == null) return null
    val prefix = "$pkg:id/"
    return if (viewId.startsWith(prefix)) viewId.substring(prefix.length) else null
  }

  /** Is this screen Shorts (YouTube) or Reels (Instagram)? */
  fun isShortForm(pkg: String, viewIds: Sequence<String?>): Boolean {
    val pattern = when (pkg) {
      YOUTUBE -> YOUTUBE_SHORTS
      INSTAGRAM -> INSTAGRAM_REELS
      else -> return false
    }
    return viewIds.any { id -> localName(pkg, id)?.let(pattern::containsMatchIn) == true }
  }

  /** Should STOIC step in for this app right now? */
  fun blocking(pkg: String, youtubeOn: Boolean, instagramOn: Boolean): Boolean = when (pkg) {
    YOUTUBE -> youtubeOn
    INSTAGRAM -> instagramOn
    else -> false
  }

  /** Ignore events right after stepping in, while the app is still leaving Shorts/Reels. */
  const val COOLDOWN_MS = 1_500L

  /** Look at no more than this many views per check, so the phone stays fast. */
  const val MAX_NODES = 600
}
