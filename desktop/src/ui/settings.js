// STOIC desktop settings. Every change is saved straight away; strict mode can refuse loosening ones.
const app = document.getElementById("app");
const toast = document.getElementById("toast");
const send = (msg) => window.stoic.send(msg);
const time = (ms) => new Date(ms).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" });
const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const fromHHMM = (v) => {
  const [h, m] = v.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const LIMITS = [0, 30, 60, 120, 180];
let all;
let focusLength = 25;
let picking = null; // list of running apps while the picker is open
let timer = 0;

function el(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k.startsWith("on")) e.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "class") e.className = v;
    else if (k === "checked" || k === "value") e[k] = v;
    else if (v === true) e.setAttribute(k, "");
    else if (v !== false && v != null) e.setAttribute(k, String(v));
  }
  e.append(...kids.filter((k) => k !== "" && k != null));
  return e;
}

function say(text) {
  toast.textContent = text;
  toast.hidden = false;
  setTimeout(() => (toast.hidden = true), 5000);
}

async function act(msg, spoken) {
  const r = await send(msg);
  if (r?.error) say(r.error);
  else if (spoken) say(spoken);
  await load();
  return r;
}

const save = (change, spoken) => {
  const next = structuredClone(all.settings);
  change(next);
  return act({ type: "save", settings: next }, spoken);
};

/** A labelled checkbox with a stable id, so keyboard focus survives a redraw. */
function check(key, label, value, onChange, hint) {
  const id = `c-${key}`.replace(/[^\w-]/g, "-");
  return el(
    "label",
    { class: "check", for: id },
    el("input", { type: "checkbox", id, checked: value, onchange: (e) => onChange(e.target.checked) }),
    el("span", {}, label, hint ? el("span", { class: "small muted" }, ` ${hint}`) : ""),
  );
}

function focusSection() {
  const s = all.settings;
  const sec = el("section", { class: "card stack tint-lavender", "aria-labelledby": "focus-h" }, el("h2", { id: "focus-h" }, "Focus with Pebble"));
  if (s.focusUntil > all.now) {
    const left = s.focusUntil - all.now;
    const mm = Math.floor(left / 60_000);
    const ss = Math.floor((left % 60_000) / 1000);
    sec.append(
      el("p", { class: "big", "aria-label": `${mm} minutes ${ss} seconds left` }, `${mm}:${String(ss).padStart(2, "0")}`),
      el("p", {}, `Apps you marked are closed until ${time(s.focusUntil)}.`),
      el("button", { type: "button", class: "outline", id: "end-focus", onclick: () => act({ type: "endFocus" }) }, "End session early"),
    );
    clearTimeout(timer);
    timer = setTimeout(load, 1000);
  } else {
    const chips = el("div", { class: "row", role: "radiogroup", "aria-label": "How long" });
    for (const m of [15, 25, 45]) {
      chips.append(el("button", { type: "button", class: "chip", role: "radio", id: `len-${m}`, "aria-checked": String(m === focusLength), onclick: () => ((focusLength = m), load()) }, `${m} min`));
    }
    sec.append(
      chips,
      el("button", { type: "button", id: "start-focus", onclick: () => act({ type: "startFocus", minutes: focusLength }, "Focus session started.") }, `Start ${focusLength} minute focus`),
      el("p", { class: "small muted" }, "You can also start one from Pebble in the tray (next to the clock)."),
    );
  }
  return sec;
}

function appsSection() {
  const s = all.settings;
  const sec = el("section", { class: "card stack", "aria-labelledby": "apps-h" }, el("h2", { id: "apps-h" }, "Apps"));
  if (s.apps.length === 0) sec.append(el("p", { class: "muted" }, "No apps yet. Add the one or two that pull you in most, like a game, Discord or a video app."));
  s.apps.forEach((a, i) => {
    const upd = (patch) => save((n) => Object.assign(n.apps[i], patch));
    const limitId = `limit-${a.key}`.replace(/[^\w-]/g, "-");
    sec.append(
      el(
        "div",
        { class: "card rule stack" },
        el("div", { class: "row", style: "justify-content: space-between" }, el("h3", {}, a.name), el("span", { class: "small muted" }, `Open today: ${Math.round((all.state.openMs[a.key] ?? 0) / 60_000)} min`)),
        check(`${a.key}-pause`, "Pause before opening", a.pause, (on) => upd({ pause: on }), "(STOIC closes it and asks first; “Open anyway” after 10 seconds)"),
        el(
          "div",
          { class: "row" },
          el("label", { for: limitId }, "Daily limit (time open)"),
          el("select", { id: limitId, onchange: (e) => upd({ limitMin: Number(e.target.value) }) }, ...LIMITS.map((m) => el("option", { value: m, ...(m === a.limitMin ? { selected: true } : {}) }, m === 0 ? "No limit" : m < 60 ? `${m} minutes` : `${m / 60} hour${m > 60 ? "s" : ""}`))),
        ),
        check(`${a.key}-focus`, "Close during focus sessions", a.blockInFocus, (on) => upd({ blockInFocus: on })),
        check(`${a.key}-extend`, "Let me add 5 more minutes", a.allowExtend, (on) => upd({ allowExtend: on }), "(off makes the limit strict until midnight)"),
        el("button", { type: "button", class: "quiet", onclick: () => save((n) => n.apps.splice(i, 1), `${a.name} removed.`) }, `Remove ${a.name}`),
      ),
    );
  });

  if (picking) {
    const list = el("div", { class: "row" });
    const taken = new Set(s.apps.map((a) => a.key));
    for (const r of picking.filter((r) => !taken.has(r.key)).slice(0, 60)) {
      list.append(el("button", { type: "button", class: "chip", onclick: () => ((picking = null), act({ type: "addApp", key: r.key, name: r.name }, `${r.name} added with a pause, and closed during focus.`)) }, r.name));
    }
    const input = el("input", { type: "text", id: "app-name", placeholder: "e.g. steam or discord", autocomplete: "off" });
    sec.append(
      el(
        "div",
        { class: "card tint-sky stack" },
        el("h3", {}, "Choose an app"),
        el("p", { class: "small" }, "Apps running now. Open the app first if you don't see it, or type its name."),
        list,
        el(
          "form",
          { class: "row", onsubmit: (e) => (e.preventDefault(), (picking = null), act({ type: "addApp", key: input.value, name: input.value }, "App added.")) },
          el("label", { for: "app-name" }, "App name"),
          input,
          el("button", { type: "submit" }, "Add"),
        ),
        el("button", { type: "button", class: "quiet", onclick: () => ((picking = null), load()) }, "Cancel"),
      ),
    );
  } else {
    sec.append(el("button", { type: "button", id: "add-app", onclick: async () => ((picking = await send({ type: "runningApps" })), load()) }, "Add an app"));
  }
  sec.append(el("p", { class: "small muted" }, "STOIC never closes system apps (like File Explorer or Finder). For websites, use STOIC for your browser."));
  return sec;
}

function schedulesSection() {
  const s = all.settings;
  const sec = el("section", { class: "card stack", "aria-labelledby": "sch-h" }, el("h2", { id: "sch-h" }, "Schedules"), el("p", { class: "small muted" }, "Hours when chosen apps stay closed, like study hours or bedtime."));
  s.schedules.forEach((sc, i) => {
    const upd = (patch) => save((n) => Object.assign(n.schedules[i], patch));
    const dayRow = el("div", { class: "row" });
    DAYS.forEach((d, k) => {
      const id = `sday-${sc.id}-${k}`;
      dayRow.append(
        el("label", { class: "check", for: id }, el("input", { type: "checkbox", id, checked: sc.days.includes(k + 1), "aria-label": DAY_NAMES[k], onchange: (e) => upd({ days: e.target.checked ? [...sc.days, k + 1].sort() : sc.days.filter((x) => x !== k + 1) }) }), el("span", { "aria-hidden": "true" }, d)),
      );
    });
    const appsId = `sapps-${sc.id}`;
    sec.append(
      el(
        "div",
        { class: "card schedule stack tint-sky" },
        el("div", { class: "row" }, el("label", { for: `sname-${sc.id}` }, "Name"), el("input", { type: "text", id: `sname-${sc.id}`, value: sc.name, maxlength: 40, onchange: (e) => upd({ name: e.target.value }) })),
        check(`${sc.id}-on`, "On", sc.enabled, (on) => upd({ enabled: on })),
        el(
          "div",
          { class: "row" },
          el("label", { for: `sstart-${sc.id}` }, "From"),
          el("input", { type: "time", id: `sstart-${sc.id}`, value: hhmm(sc.startMin), onchange: (e) => upd({ startMin: fromHHMM(e.target.value) }) }),
          el("label", { for: `send-${sc.id}` }, "to"),
          el("input", { type: "time", id: `send-${sc.id}`, value: hhmm(sc.endMin), onchange: (e) => upd({ endMin: fromHHMM(e.target.value) }) }),
        ),
        sc.endMin < sc.startMin ? el("p", { class: "small muted" }, "Runs past midnight and ends the next morning.") : "",
        el("fieldset", {}, el("legend", {}, "Days"), dayRow),
        el("div", { class: "stack" }, el("label", { for: appsId }, "Apps it closes (separate with commas)"), el("input", { type: "text", id: appsId, value: sc.apps.join(", "), style: "width: 100%", onchange: (e) => upd({ apps: e.target.value.split(/[,]+/).map((x) => x.trim()).filter(Boolean) }) })),
        el("button", { type: "button", class: "quiet", onclick: () => save((n) => n.schedules.splice(i, 1), `${sc.name} removed.`) }, `Remove ${sc.name}`),
      ),
    );
  });
  sec.append(
    el(
      "button",
      {
        type: "button",
        class: "outline",
        onclick: () => save((n) => n.schedules.push({ id: `s${Date.now().toString(36)}`, name: n.schedules.some((x) => x.name === "Study hours") ? "New schedule" : "Study hours", enabled: true, days: [1, 2, 3, 4, 5], startMin: 540, endMin: 1020, apps: n.apps.map((a) => a.key) }), "Schedule added: weekdays, 9 to 5."),
      },
      "Add a schedule",
    ),
  );
  return sec;
}

function strictSection() {
  const s = all.settings;
  const sec = el("section", { class: "card stack tint-rose", "aria-labelledby": "strict-h" }, el("h2", { id: "strict-h" }, "Strict mode"));
  if (s.strictUntil > all.now) {
    const req = all.state.unlockRequestedAt;
    const left = req ? req + 15 * 60_000 - all.now : 0;
    sec.append(el("p", {}, el("strong", {}, `🔒 On until ${time(s.strictUntil)}. `), "You can add apps and tighten rules, but not loosen them, and STOIC can't be quit from its menu."));
    if (!req) sec.append(el("button", { type: "button", class: "outline", onclick: () => act({ type: "requestUnlock" }) }, "Unlock early"), el("p", { class: "small muted" }, "Unlocking early asks you to wait 15 minutes first."));
    else if (left > 0) sec.append(el("p", { role: "status" }, `You can unlock in about ${Math.ceil(left / 60_000)} minutes.`), el("button", { type: "button", class: "quiet", onclick: () => act({ type: "cancelUnlock" }) }, "Never mind, stay strict"));
    else sec.append(el("button", { type: "button", onclick: () => act({ type: "unlockNow" }, "Strict mode is off.") }, "Unlock now"), el("button", { type: "button", class: "quiet", onclick: () => act({ type: "cancelUnlock" }) }, "Stay strict"));
    return sec;
  }
  const sel = el("select", { id: "strict-len" }, ...[["1 hour", 60], ["4 hours", 240], ["Until 7 AM", -1], ["1 day", 1440], ["1 week", 10080]].map(([l, m]) => el("option", { value: m, ...(m === 240 ? { selected: true } : {}) }, l)));
  sec.append(
    el("p", { class: "small" }, "For days you know you'll be tempted: until the time you pick, rules can get stricter but never looser, and “5 more minutes” is hidden."),
    el("div", { class: "row" }, el("label", { for: "strict-len" }, "How long"), sel),
    el(
      "button",
      {
        type: "button",
        onclick: async () => {
          const m = Number(sel.value);
          let until;
          if (m === -1) {
            const d = new Date();
            d.setHours(7, 0, 0, 0);
            if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
            until = d.getTime();
          } else until = Date.now() + m * 60_000;
          if (!confirm(`Until ${time(until)}, you won't be able to loosen your rules or quit STOIC from its menu. Unlocking early takes 15 minutes. Start strict mode?`)) return;
          await act({ type: "startStrict", until }, "Strict mode is on.");
        },
      },
      "Start strict mode",
    ),
    el("p", { class: "small muted" }, "Strict mode can't stop Task Manager (or Activity Monitor) from ending STOIC, or restarting the computer. It's there for weak moments, not as a lock."),
  );
  return sec;
}

function generalSection() {
  const s = all.settings;
  return el(
    "section",
    { class: "card stack", "aria-labelledby": "gen-h" },
    el("h2", { id: "gen-h" }, "General"),
    all.platform === "linux" ? "" : check("login", "Open STOIC when I log in", s.openAtLogin, (on) => save((n) => (n.openAtLogin = on))),
    el("p", { class: "small" }, "Closing this window keeps STOIC running in the tray. Your rules and today's time per app stay on this computer and are never sent anywhere."),
  );
}

async function load() {
  all = await send({ type: "getAll" });
  const focused = document.activeElement?.id;
  app.replaceChildren(focusSection(), appsSection(), schedulesSection(), strictSection(), generalSection());
  if (focused) document.getElementById(focused)?.focus();
}

load();
