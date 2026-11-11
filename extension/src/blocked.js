// STOIC's interruption page: pause, time's up, focus, schedule and strict mode.
import { PAUSE_MS } from "./rules.js";

const q = new URLSearchParams(location.search);
const kind = q.get("kind") ?? "PAUSE";
const url = q.get("url") ?? "";
const domain = q.get("domain") ?? "this site";
const time = (/** @type {number} */ ms) => new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const minTime = (/** @type {number} */ min) => time(new Date(2000, 0, 1, Math.floor(min / 60), min % 60).getTime());

const title = /** @type {HTMLElement} */ (document.getElementById("title"));
const body = /** @type {HTMLElement} */ (document.getElementById("body"));
const back = /** @type {HTMLButtonElement} */ (document.getElementById("back"));
const other = /** @type {HTMLButtonElement} */ (document.getElementById("other"));

const send = (/** @type {any} */ msg) => chrome.runtime.sendMessage(msg);

function goBack() {
  // Leave the site: back in history if there is somewhere to go, otherwise a new tab page.
  if (history.length > 1) history.back();
  else chrome.tabs.getCurrent((t) => t?.id !== undefined && chrome.tabs.update(t.id, { url: "chrome://newtab/" }));
}

/** @param {string} label @param {() => Promise<void>} onClick */
function offer(label, onClick) {
  other.textContent = label;
  other.hidden = false;
  other.addEventListener("click", onClick, { once: true });
}

switch (kind) {
  case "PAUSE": {
    title.textContent = "Pause for a moment";
    body.textContent = `You asked for a short pause before opening ${domain}. Is this important right now?`;
    // "Open anyway" appears after a short wait. The spoken label stays stable so screen readers don't repeat every second.
    other.hidden = false;
    other.disabled = true;
    other.setAttribute("aria-label", "Open anyway, available in a few seconds");
    const end = Date.now() + PAUSE_MS;
    const tick = () => {
      const left = Math.ceil((end - Date.now()) / 1000);
      if (left > 0) {
        other.textContent = `Open anyway (${left})`;
        setTimeout(tick, 250);
        return;
      }
      other.textContent = "Open anyway";
      other.removeAttribute("aria-label");
      other.disabled = false;
      const live = document.createElement("p");
      live.className = "sr-only";
      live.setAttribute("role", "status");
      live.textContent = "Open anyway is now available";
      document.body.append(live);
    };
    tick();
    other.addEventListener("click", async () => {
      await send({ type: "openAnyway", domain });
      location.replace(url);
    });
    break;
  }
  case "LIMIT":
    title.textContent = "That's your time for today";
    body.textContent = `You set a daily limit of ${q.get("limitMin")} minutes for ${domain}, and you've reached it. It starts fresh at midnight.`;
    if (q.get("allowExtend") === "true") {
      offer("5 more minutes", async () => {
        const r = await send({ type: "moreTime", domain });
        if (!r?.error) location.replace(url);
      });
    }
    break;
  case "FOCUS":
    title.textContent = "You're in a focus session";
    body.textContent = `${domain} is paused until your session ends at ${time(Number(q.get("until")))}. Pebble is growing.`;
    break;
  case "SCHEDULE":
    title.textContent = `${q.get("schedule") || "Your schedule"} is on`;
    body.textContent = `${domain} is paused until ${minTime(Number(q.get("endMin")))}.`;
    break;
  case "STRICT":
    title.textContent = "Strict mode is on";
    body.textContent = `The extensions page is locked until ${time(Number(q.get("until")))}. You set this up to protect your goals.`;
    break;
}
document.title = `${title.textContent} · STOIC`;
back.addEventListener("click", goBack);
back.focus();
