// Pebble's window: STOIC closed an app because of one of your rules.
const PAUSE_MS = 10_000;
const q = new URLSearchParams(location.search);
const kind = q.get("kind") ?? "PAUSE";
const key = q.get("key") ?? "";
const name = q.get("name") || "this app";
const time = (ms) => new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const minTime = (min) => time(new Date(2000, 0, 1, Math.floor(min / 60), min % 60).getTime());
const $ = (id) => document.getElementById(id);
const send = (msg) => window.stoic.send(msg);

const title = $("title");
const body = $("body");
const other = $("other");

function offer(label, msg) {
  other.textContent = label;
  other.hidden = false;
  other.addEventListener("click", () => send(msg), { once: true });
}

switch (kind) {
  case "PAUSE": {
    title.textContent = "Pause for a moment";
    body.textContent = `You asked for a short pause before opening ${name}. Is this important right now?`;
    if (q.get("canReopen") !== "true") break;
    other.hidden = false;
    other.disabled = true;
    other.setAttribute("aria-label", "Open anyway, available in a few seconds");
    const end = Date.now() + PAUSE_MS;
    const tickDown = () => {
      const left = Math.ceil((end - Date.now()) / 1000);
      if (left > 0) {
        other.textContent = `Open anyway (${left})`;
        setTimeout(tickDown, 250);
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
    tickDown();
    other.addEventListener("click", () => send({ type: "openAnyway", key }), { once: true });
    break;
  }
  case "LIMIT":
    title.textContent = "That's your time for today";
    body.textContent = `You set a daily limit of ${q.get("limitMin")} minutes for ${name}, and you've reached it. It starts fresh at midnight.`;
    if (q.get("allowExtend") === "true") offer("5 more minutes", { type: "moreTime", key });
    break;
  case "FOCUS":
    title.textContent = "You're in a focus session";
    body.textContent = `${name} is closed until your session ends at ${time(Number(q.get("until")))}. Pebble is growing.`;
    break;
  case "SCHEDULE":
    title.textContent = `${q.get("schedule") || "Your schedule"} is on`;
    body.textContent = `${name} is closed until ${minTime(Number(q.get("endMin")))}.`;
    break;
}
document.title = `${title.textContent} · STOIC`;
$("back").addEventListener("click", () => send({ type: "closeBlock" }));
$("settings").addEventListener("click", () => send({ type: "openSettings" }));
$("back").focus();
