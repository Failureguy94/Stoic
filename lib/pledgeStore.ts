/**
 * Weekly pledge storage: localStorage ONLY (never sent anywhere).
 * Safe when storage is blocked (private mode): falls back to memory for the visit.
 */

export type Outcome = "kept" | "partly" | "rest";

export interface Pledge {
  goal: string;
  startedWeek: string; // Monday, YYYY-MM-DD
  checkIns: Record<string, Outcome>; // keyed by Monday of the week
}

const KEY = "stoic-pledge-v2";
const listeners = new Set<() => void>();
let raw: string | null | undefined;
let cached: Pledge | null = null;
let memoryOnly = false;

function read(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    memoryOnly = true;
    return null;
  }
}

export function getPledge(): Pledge | null {
  if (memoryOnly) return cached;
  const r = read();
  if (r !== raw) {
    raw = r;
    try {
      cached = r ? (JSON.parse(r) as Pledge) : null;
    } catch {
      cached = null;
    }
  }
  return cached;
}

export function setPledge(next: Pledge | null) {
  try {
    if (next) window.localStorage.setItem(KEY, JSON.stringify(next));
    else window.localStorage.removeItem(KEY);
  } catch {
    memoryOnly = true;
    cached = next;
  }
  listeners.forEach((l) => l());
}

export function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => e.key === KEY && cb();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** Monday of the week containing `d`, as YYYY-MM-DD (local time). */
export function weekOf(d = new Date()) {
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
  return [monday.getFullYear(), monday.getMonth() + 1, monday.getDate()]
    .map((n, i) => (i ? String(n).padStart(2, "0") : String(n)))
    .join("-");
}

export function shiftWeek(key: string, n: number) {
  const [y, m, d] = key.split("-").map(Number);
  return weekOf(new Date(y, m - 1, d + n * 7));
}

export function weekLabel(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
