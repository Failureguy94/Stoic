package app.stoic.device

/**
 * Strict mode: until a chosen time, settings can only get stricter, never looser.
 * Pure Kotlin, unit-tested in StrictTest.kt.
 */
object Strict {
  /** "Unlock early" asks the user to wait this long first: friction for a weak moment, not a prison. */
  const val UNLOCK_WAIT_MS = 15 * 60_000L

  fun isActive(until: Long, now: Long) = until > now

  /** A stricter-or-equal value for "0 means no limit" settings (daily minutes, opens, check-in minutes). */
  private fun limitLooser(old: Int, new: Int): Boolean = when {
    old == 0 -> false // there was no limit: anything is at least as strict
    new == 0 -> true // removing a limit
    else -> new > old // raising it
  }

  /** Would replacing `old` with `new` loosen any app rule? */
  fun looserRules(old: Map<String, Rule>, new: Map<String, Rule>): String? {
    for ((pkg, o) in old) {
      val n = new[pkg] ?: return "remove ${o.label}"
      if (limitLooser(o.limitMin, n.limitMin)) return "raise ${o.label}'s daily limit"
      if (limitLooser(o.maxOpens, n.maxOpens)) return "allow more opens of ${o.label}"
      if (limitLooser(o.checkInMin, n.checkInMin)) return "check in less often on ${o.label}"
      if (o.pause && !n.pause) return "turn off ${o.label}'s pause"
      if (o.blockInFocus && !n.blockInFocus) return "unblock ${o.label} during focus"
      if (!o.allowExtend && n.allowExtend) return "allow going over on ${o.label}"
    }
    return null
  }

  /** Would replacing `old` with `new` loosen any schedule that was switched on? */
  fun looserSchedules(old: List<Schedule>, new: List<Schedule>): String? {
    val byId = new.associateBy { it.id }
    for (o in old.filter { it.enabled }) {
      val n = byId[o.id] ?: return "remove ${o.name}"
      if (!n.enabled) return "switch off ${o.name}"
      if (!n.days.containsAll(o.days)) return "take days off ${o.name}"
      if (n.startMin != o.startMin || n.endMin != o.endMin) return "change ${o.name}'s hours"
      if (o.allApps && !n.allApps) return "make ${o.name} block fewer apps"
      if (!o.allApps && !n.allApps && !n.packages.containsAll(o.packages)) return "remove apps from ${o.name}"
      if (o.dnd && !n.dnd) return "turn off Do Not Disturb for ${o.name}"
      if (!o.allowSnooze && n.allowSnooze) return "allow 5 more minutes in ${o.name}"
    }
    return null
  }

  /** Adding always-allowed apps lets more through; removing them is fine. */
  fun looserAllowed(old: Set<String>, new: Set<String>): String? =
    if (!old.containsAll(new)) "always allow more apps" else null

  /** Would replacing the website settings `old` with `new` let more through? */
  fun looserSites(old: SiteSettings, new: SiteSettings): String? {
    if (old.enabled && !new.enabled) return "turn off website blocking"
    if (old.enabled && !new.sites.containsAll(old.sites)) return "remove blocked sites"
    if (old.enabled && old.always && !new.always) return "block sites only some of the time"
    if (old.internetOff && !new.internetOff) return "turn off “Internet off”"
    return null
  }

  /** Switching off the Shorts or Reels blocker. */
  fun looserReels(oldYouTube: Boolean, oldInstagram: Boolean, newYouTube: Boolean, newInstagram: Boolean): String? = when {
    oldYouTube && !newYouTube -> "turn off blocking YouTube Shorts"
    oldInstagram && !newInstagram -> "turn off blocking Instagram Reels"
    else -> null
  }

  /** Ending a running focus block early. */
  fun looserFocus(oldUntil: Long, newUntil: Long, now: Long): String? =
    if (oldUntil > now && newUntil < oldUntil) "end the focus session early" else null

  /** Strict mode can be extended while on, never shortened. */
  fun newUntil(currentUntil: Long, requested: Long, now: Long): Long =
    if (isActive(currentUntil, now)) maxOf(currentUntil, requested) else requested

  /** May "Unlock early" finish now? */
  fun canUnlockEarly(requestedAt: Long, now: Long) = requestedAt > 0 && now - requestedAt >= UNLOCK_WAIT_MS

  /**
   * System screens strict mode covers while on: the app installer/uninstaller always,
   * and Settings only if the user chose "Also lock Settings".
   */
  fun blocksSystemApp(pkg: String, lockSettings: Boolean, installers: Set<String>, settings: Set<String>): Boolean =
    pkg in installers || (lockSettings && pkg in settings)
}
