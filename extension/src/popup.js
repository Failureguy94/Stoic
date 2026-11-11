// STOIC popup: focus timer and the current site.
import { hostOf, matchDomain } from "./rules.js";

const app = /** @type {HTMLElement} */ (document.getElementById("app"));
const send = (/** @type {any} */ msg) => chrome.runtime.sendMessage(msg);
const time = (/** @type {number} */ ms) => new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const mins = (/** @type {number} */ ms) => (ms < 60_000 ? "under 1 min" : `${Math.round(ms / 60_000)} min`);
let length = 25;
let timer = 0;

/** Small helper to build elements. @param {string} tag @param {Record<string, any>} props @param {(Node|string)[]} kids */
function el(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k.startsWith("on")) e.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "class") e.className = v;
    else if (v === true) e.setAttribute(k, "");
    else if (v !== false && v != null) e.setAttribute(k, String(v));
  }
  e.append(...kids);
  return e;
}

async function render() {
  clearTimeout(timer);
  const { settings, state, now } = await send({ type: "getAll" });
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const strict = settings.strictUntil > now;
  app.replaceChildren();

  // Focus
  const focus = el("section", { class: "card tint-lavender stack", "aria-labelledby": "focus-h" }, el("h2", { id: "focus-h" }, "Focus with Pebble"));
  if (settings.focusUntil > now) {
    const left = settings.focusUntil - now;
    const mm = Math.floor(left / 60_000);
    const ss = Math.floor((left % 60_000) / 1000);
    focus.append(
      el("p", { class: "big", "aria-label": `${mm} minutes ${ss} seconds left` }, `${mm}:${String(ss).padStart(2, "0")}`),
      el("p", {}, `Your focus sites are blocked until ${time(settings.focusUntil)}.`),
      el("button", { type: "button", class: "outline", onclick: () => act({ type: "endFocus" }), disabled: strict }, "End session early"),
      strict ? el("p", { class: "small" }, "Strict mode is on, so the session can't end early.") : "",
    );
    timer = setTimeout(render, 1000);
  } else {
    const chips = el("div", { class: "row", role: "radiogroup", "aria-label": "How long" });
    for (const m of [15, 25, 45]) {
      chips.append(
        el("button", { type: "button", class: "chip", role: "radio", "aria-checked": String(m === length), onclick: () => ((length = m), render()) }, `${m} min`),
      );
    }
    focus.append(chips, el("button", { type: "button", onclick: () => act({ type: "startFocus", minutes: length }) }, `Start ${length} minute focus`));
    if (!settings.sites.some((/** @type {any} */ r) => r.blockInFocus)) {
      focus.append(el("p", { class: "small" }, "No sites are set to block during focus yet. Add one below or in settings."));
    }
  }
  app.append(focus);

  // This site
  const host = tab?.url ? hostOf(tab.url) : null;
  if (host) {
    const domain = matchDomain(host, settings.sites.map((/** @type {any} */ r) => r.domain));
    const card = el("section", { class: "card stack", "aria-labelledby": "site-h" }, el("h2", { id: "site-h" }, domain ?? host.replace(/^www\./, "")));
    if (domain) {
      const r = settings.sites.find((/** @type {any} */ x) => x.domain === domain);
      const rules = [r.pause && "a pause first", r.limitMin && `${r.limitMin} min a day`, r.blockInFocus && "blocked during focus"].filter(Boolean);
      card.append(
        el("p", {}, `Today: ${mins(state.usage.ms[domain] ?? 0)}`),
        el("p", { class: "small muted" }, rules.length ? `Your rules: ${rules.join(", ")}.` : "No rules switched on."),
      );
    } else {
      card.append(
        el("p", { class: "small" }, "Pulls you in? Add a 10-second pause before it opens, and block it during focus."),
        el("button", { type: "button", class: "outline", onclick: () => act({ type: "addSite", domain: host }) }, "Add a pause for this site"),
      );
    }
    app.append(card);
  }

  if (strict) {
    app.append(el("section", { class: "card tint-rose" }, el("p", {}, `🔒 Strict mode is on until ${time(settings.strictUntil)}.`)));
  }
}

async function act(/** @type {any} */ msg) {
  const r = await send(msg);
  if (r?.error) app.prepend(el("p", { class: "card tint-butter", role: "alert" }, r.error));
  else render();
}

render();
