/** Week maths shared by the pledge and the usage log. Weeks start on Monday (local time). */

const pad = (n: number) => String(n).padStart(2, "0");

/** YYYY-MM-DD for a local date. */
export function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Monday of the week containing `d`, as YYYY-MM-DD. */
export function weekOf(d = new Date()) {
  return dayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7)));
}

export function parseKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function shiftWeek(key: string, n: number) {
  const d = parseKey(key);
  return weekOf(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n * 7));
}

export function shiftDay(key: string, n: number) {
  const d = parseKey(key);
  return dayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "9 Nov" */
export function shortDate(key: string) {
  const d = parseKey(key);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "Mon" */
export function weekday(key: string) {
  return DAYS[parseKey(key).getDay()];
}

/** "1h 25m", "40m", "under 1m" */
export function formatDuration(ms: number) {
  const mins = Math.round(ms / 60000);
  if (mins < 1) return "under 1m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}
