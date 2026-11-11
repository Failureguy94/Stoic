// STOIC settings page. Every change is saved straight away; strict mode can refuse loosening ones.
import { normalizeSite } from "./rules.js";

const app = /** @type {HTMLElement} */ (document.getElementById("app"));
const toast = /** @type {HTMLElement} */ (document.getElementById("toast"));
const send = (/** @type {any} */ msg) => chrome.runtime.sendMessage(msg);
const time = (/** @type {number} */ ms) => new Date(ms).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" });
const hhmm = (/** @type {number} */ m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const fromHHMM = (/** @type {string} */ v) => {
  const [h, m] = v.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const LIMITS = [0, 15, 30, 60, 120];
const PRESETS = ["youtube.com", "instagram.com", "reddit.com", "x.com", "facebook.com", "netflix.com", "tiktok.com"];
const YT = [
  ["feed", "Hide the home feed"],
  ["shorts", "Hide Shorts (and open any Short as a normal video)"],
  ["sidebar", "Hide recommendations next to videos"],
  ["endscreen", "Hide end-screen suggestions and the autoplay countdown"],
  ["comments", "Hide comments"],
];

/** @type {any} */ let all;

/** @param {string} tag @param {Record<string, any>} props @param {(Node|string)[]} kids */
function el(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k.startsWith("on")) e.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "class") e.className = v;
    else if (k === "checked" || k === "value") /** @type {any} */ (e)[k] = v;
    else if (v === true) e.setAttribute(k, "");
    else if (v !== false && v != null) e.setAttribute(k, String(v));
  }
  e.append(...kids.filter((k) => k !== ""));
  return e;
}

function say(/** @type {string} */ text) {
  toast.textContent = text;
  toast.hidden = false;
  setTimeout(() => (toast.hidden = true), 5000);
}

/** Save a change to the settings, then redraw from what was really saved. */
async function save(/** @type {(s: any) => void} */ change, /** @type {string=} */ spoken) {
  const next = structuredClone(all.settings);
  change(next);
  const r = await send({ type: "save", settings: next });
  if (r?.error) say(r.error);
  else if (spoken) say(spoken);
  await load();
}

/** A checkbox with a label. `key` gives it a stable id, so keyboard focus survives a redraw. */
function check(/** @type {string} */ key, /** @type {string} */ label, /** @type {boolean} */ value, /** @type {(on: boolean) => void} */ onChange, /** @type {string=} */ hint) {
  const id = `c-${key}`.replace(/[^\w-]/g, "-");
  return el(
    "label",
    { class: "check", for: id },
    el("input", { type: "checkbox", id, checked: value, onchange: (/** @type {any} */ e) => onChange(e.target.checked) }),
    el("span", {}, label, hint ? el("span", { class: "small muted" }, ` ${hint}`) : ""),
  );
}

function sitesSection() {
  const s = all.settings;
  const usage = all.state.usage.ms;
  const input = el("input", { type: "text", id: "add-site", placeholder: "example.com", autocomplete: "off", "aria-describedby": "add-hint" });
  const add = async (/** @type {string} */ raw) => {
    const domain = normalizeSite(raw);
    if (!domain) return say("That doesn't look like a website. Try something like example.com.");
    const r = await send({ type: "addSite", domain });
    if (r?.error) say(r.error);
    else say(`${domain} added with a pause and blocked during focus.`);
    await load();
  };
  const form = el(
    "form",
    { class: "row", onsubmit: (/** @type {Event} */ e) => (e.preventDefault(), add(/** @type {HTMLInputElement} */ (input).value)) },
    el("label", { for: "add-site", class: "sr-only" }, "Website to add"),
    input,
    el("button", { type: "submit" }, "Add site"),
  );
  const quick = el("div", { class: "row" });
  for (const d of PRESETS.filter((d) => !s.sites.some((/** @type {any} */ r) => r.domain === d))) {
    quick.append(el("button", { type: "button", class: "chip", onclick: () => add(d) }, `+ ${d}`));
  }

  const list = el("div", {});
  if (s.sites.length === 0) list.append(el("p", { class: "muted" }, "No sites yet. Add the one or two that pull you in most."));
  s.sites.forEach((/** @type {any} */ r, /** @type {number} */ i) => {
    const upd = (/** @type {any} */ patch) => save((n) => Object.assign(n.sites[i], patch));
    const limitId = `limit${i}`;
    const used = usage[r.domain] ?? 0;
    list.append(
      el(
        "div",
        { class: "card site stack" },
        el("div", { class: "row", style: "justify-content: space-between" }, el("h3", {}, r.domain), el("span", { class: "small muted" }, `Today: ${Math.round(used / 60_000)} min`)),
        check(`${r.domain}-pause`, "Pause before opening", r.pause, (on) => upd({ pause: on }), "(10 seconds, then “Open anyway”)"),
        el(
          "div",
          { class: "row" },
          el("label", { for: limitId }, "Daily limit"),
          el(
            "select",
            { id: limitId, onchange: (/** @type {any} */ e) => upd({ limitMin: Number(e.target.value) }) },
            ...LIMITS.map((m) => el("option", { value: m, ...(m === r.limitMin ? { selected: true } : {}) }, m === 0 ? "No limit" : m < 60 ? `${m} minutes` : `${m / 60} hour${m > 60 ? "s" : ""}`)),
          ),
        ),
        check(`${r.domain}-focus`, "Block during focus sessions", r.blockInFocus, (on) => upd({ blockInFocus: on })),
        check(`${r.domain}-extend`, "Let me add 5 more minutes", r.allowExtend, (on) => upd({ allowExtend: on }), "(off makes the limit strict until midnight)"),
        el("button", { type: "button", class: "quiet", onclick: () => save((n) => n.sites.splice(i, 1), `${r.domain} removed.`) }, `Remove ${r.domain}`),
      ),
    );
  });

  return el(
    "section",
    { class: "card stack", "aria-labelledby": "sites-h" },
    el("h2", { id: "sites-h" }, "Sites"),
    el("p", { id: "add-hint", class: "small muted" }, "Subdomains are included: adding youtube.com covers www.youtube.com and m.youtube.com."),
    form,
    quick,
    list,
  );
}

function schedulesSection() {
  const s = all.settings;
  const list = el("div", {});
  if (s.schedules.length === 0) list.append(el("p", { class: "muted" }, "None yet. Study hours on weekdays is a good first one."));
  s.schedules.forEach((/** @type {any} */ sc, /** @type {number} */ i) => {
    const upd = (/** @type {any} */ patch) => save((n) => Object.assign(n.schedules[i], patch));
    const ids = { name: `sn${i}`, start: `ss${i}`, end: `se${i}`, sites: `sd${i}` };
    const days = el("fieldset", { class: "days" }, el("legend", {}, "Days"));
    const dayRow = el("div", { class: "row" });
    DAYS.forEach((d, k) => {
      const id = `sday${i}-${k}`;
      dayRow.append(
        el(
          "label",
          { class: "check", for: id },
          el("input", {
            type: "checkbox",
            id,
            checked: sc.days.includes(k + 1),
            "aria-label": DAY_NAMES[k],
            onchange: (/** @type {any} */ e) => upd({ days: e.target.checked ? [...sc.days, k + 1].sort() : sc.days.filter((/** @type {number} */ x) => x !== k + 1) }),
          }),
          el("span", { "aria-hidden": "true" }, d),
        ),
      );
    });
    days.append(dayRow);
    list.append(
      el(
        "div",
        { class: "card schedule stack tint-sky" },
        el("div", { class: "row" }, el("label", { for: ids.name }, "Name"), el("input", { type: "text", id: ids.name, value: sc.name, maxlength: 40, onchange: (/** @type {any} */ e) => upd({ name: e.target.value }) })),
        check(`${sc.id}-on`, "On", sc.enabled, (on) => upd({ enabled: on })),
        el(
          "div",
          { class: "row" },
          el("label", { for: ids.start }, "From"),
          el("input", { type: "time", id: ids.start, value: hhmm(sc.startMin), onchange: (/** @type {any} */ e) => upd({ startMin: fromHHMM(e.target.value) }) }),
          el("label", { for: ids.end }, "to"),
          el("input", { type: "time", id: ids.end, value: hhmm(sc.endMin), onchange: (/** @type {any} */ e) => upd({ endMin: fromHHMM(e.target.value) }) }),
        ),
        sc.endMin < sc.startMin ? el("p", { class: "small muted" }, "Runs past midnight and ends the next morning.") : "",
        days,
        el(
          "div",
          { class: "stack" },
          el("label", { for: ids.sites }, "Sites it blocks (separate with commas)"),
          el("input", {
            type: "text",
            id: ids.sites,
            value: sc.domains.join(", "),
            style: "width: 100%",
            onchange: (/** @type {any} */ e) => upd({ domains: e.target.value.split(/[,\s]+/).map(normalizeSite).filter(Boolean) }),
          }),
        ),
        el("button", { type: "button", class: "quiet", onclick: () => save((n) => n.schedules.splice(i, 1), `${sc.name} removed.`) }, `Remove ${sc.name}`),
      ),
    );
  });
  const addBtn = el(
    "button",
    {
      type: "button",
      class: "outline",
      onclick: () =>
        save(
          (n) =>
            n.schedules.push({
              id: `s${Date.now().toString(36)}`,
              name: n.schedules.some((/** @type {any} */ x) => x.name === "Study hours") ? "New schedule" : "Study hours",
              enabled: true,
              days: [1, 2, 3, 4, 5],
              startMin: 9 * 60,
              endMin: 17 * 60,
              domains: n.sites.map((/** @type {any} */ r) => r.domain),
            }),
          "Schedule added: weekdays, 9 to 5.",
        ),
    },
    "Add a schedule",
  );
  return el("section", { class: "card stack", "aria-labelledby": "sch-h" }, el("h2", { id: "sch-h" }, "Schedules"), el("p", { class: "small muted" }, "Hours when sites stay closed, like study hours or bedtime."), list, addBtn);
}

function youtubeSection() {
  const y = all.settings.youtube;
  return el(
    "section",
    { class: "card stack tint-peach", "aria-labelledby": "yt-h" },
    el("h2", { id: "yt-h" }, "A calmer YouTube"),
    el("p", { class: "small" }, "Keep YouTube for what you came for. These only change how youtube.com looks in this browser."),
    ...YT.map(([k, label]) => check(`yt-${k}`, label, !!y[k], (on) => save((n) => (n.youtube[k] = on)))),
  );
}

function strictSection() {
  const s = all.settings;
  const now = all.now;
  const sec = el("section", { class: "card stack tint-rose", "aria-labelledby": "strict-h" }, el("h2", { id: "strict-h" }, "Strict mode"));
  if (s.strictUntil > now) {
    const req = all.state.unlockRequestedAt;
    const left = req ? req + 15 * 60_000 - now : 0;
    sec.append(
      el("p", {}, el("strong", {}, `🔒 On until ${time(s.strictUntil)}. `), "You can add sites and tighten rules, but not loosen them."),
      s.lockExtensionsPage ? el("p", { class: "small" }, "The browser's extensions page is locked too.") : "",
    );
    if (!req) {
      sec.append(el("button", { type: "button", class: "outline", onclick: () => act({ type: "requestUnlock" }) }, "Unlock early"), el("p", { class: "small muted" }, "Unlocking early asks you to wait 15 minutes first."));
    } else if (left > 0) {
      sec.append(el("p", { role: "status" }, `You can unlock in about ${Math.ceil(left / 60_000)} minutes.`), el("button", { type: "button", class: "quiet", onclick: () => act({ type: "cancelUnlock" }) }, "Never mind, stay strict"));
    } else {
      sec.append(el("button", { type: "button", onclick: () => act({ type: "unlockNow" }, "Strict mode is off.") }, "Unlock now"), el("button", { type: "button", class: "quiet", onclick: () => act({ type: "cancelUnlock" }) }, "Stay strict"));
    }
    return sec;
  }
  const lengths = [
    ["1 hour", 60],
    ["4 hours", 240],
    ["Until 7 AM", -1],
    ["1 day", 1440],
    ["1 week", 10080],
  ];
  const sel = el("select", { id: "strict-len" }, ...lengths.map(([l, m]) => el("option", { value: m, ...(m === 240 ? { selected: true } : {}) }, String(l))));
  let lockExt = false;
  sec.append(
    el("p", { class: "small" }, "For days you know you'll be tempted: until the time you pick, your rules can get stricter but never looser, and “5 more minutes” is hidden."),
    el("div", { class: "row" }, el("label", { for: "strict-len" }, "How long"), sel),
    check("strict-lock", "Also lock the browser's extensions page", false, (on) => (lockExt = on), "(so STOIC can't be switched off there)"),
    el(
      "button",
      {
        type: "button",
        onclick: async () => {
          const m = Number(/** @type {HTMLSelectElement} */ (sel).value);
          let until;
          if (m === -1) {
            const d = new Date();
            d.setHours(7, 0, 0, 0);
            if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
            until = d.getTime();
          } else until = Date.now() + m * 60_000;
          if (!confirm(`Until ${time(until)}, you won't be able to loosen your rules. Unlocking early takes 15 minutes. Start strict mode?`)) return;
          await act({ type: "startStrict", until, lockExtensionsPage: lockExt }, "Strict mode is on.");
        },
      },
      "Start strict mode",
    ),
    el("p", { class: "small muted" }, "Strict mode can't stop another browser, a private window without STOIC, or removing the extension from browser settings you haven't locked."),
  );
  return sec;
}

function privacySection() {
  return el(
    "section",
    { class: "card stack", "aria-labelledby": "priv-h" },
    el("h2", { id: "priv-h" }, "Privacy"),
    el("p", {}, "STOIC keeps your rules and today's time on each site in this browser only. It never sends anything anywhere, and it only counts time on sites you added."),
    el("p", { class: "small" }, el("a", { href: "https://stoic-psi-one.vercel.app/docs", target: "_blank", rel: "noopener" }, "STOIC how-to guides")),
  );
}

async function act(/** @type {any} */ msg, /** @type {string=} */ spoken) {
  const r = await send(msg);
  if (r?.error) say(r.error);
  else if (spoken) say(spoken);
  await load();
}

async function load() {
  all = await send({ type: "getAll" });
  const focusOn = document.activeElement?.id;
  app.replaceChildren(sitesSection(), schedulesSection(), youtubeSection(), strictSection(), privacySection());
  if (focusOn) document.getElementById(focusOn)?.focus();
}

load();
