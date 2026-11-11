// STOIC on YouTube: hide the parts you chose (home feed, Shorts, recommendations, end screens, comments).
// It only adds class names to the page and reads STOIC's own settings. Nothing you watch is read or sent anywhere.

const KEYS = ["feed", "shorts", "sidebar", "endscreen", "comments"];
let options = { feed: true, shorts: true, sidebar: true, endscreen: true, comments: false };

function apply() {
  const root = document.documentElement;
  for (const k of KEYS) root.classList.toggle(`stoic-${k}`, !!options[k]);
  redirectShorts();
}

/** Open a Short in the normal player, where it is one video rather than an endless swipe. */
function redirectShorts() {
  if (!options.shorts) return;
  const m = location.pathname.match(/^\/shorts\/([\w-]{6,})/);
  if (m) location.replace(`/watch?v=${m[1]}`);
}

chrome.storage.local.get("settings").then(({ settings }) => {
  if (settings?.youtube) options = { ...options, ...settings.youtube };
  apply();
});
chrome.storage.onChanged.addListener((changes) => {
  const next = changes.settings?.newValue?.youtube;
  if (next) {
    options = { ...options, ...next };
    apply();
  }
});

// YouTube changes pages without reloading.
document.addEventListener("yt-navigate-start", redirectShorts);
document.addEventListener("yt-navigate-finish", redirectShorts);
window.addEventListener("popstate", redirectShorts);
apply();
