"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";

/*
 * Weekly pledge, stored ONLY in this browser's localStorage.
 * Tone rules: no shame, no failure messages. A missed week is a "rest week"
 * and never resets the count of weeks kept.
 */

const STORAGE_KEY = "stoic-pledge-v1";

export const PRESET_GOALS = [
  "No phone for the first 30 minutes of study",
  "Phone in another room while I study",
  "No reels or shorts after 11 pm",
  "Notifications off during lectures and study",
  "One app timer, and I don't delete it",
];

type Outcome = "kept" | "partly" | "not-this-week";

interface PledgeState {
  goal: string;
  startedWeek: string; // Monday of the starting week, YYYY-MM-DD
  checkIns: Record<string, Outcome>; // keyed by Monday of the week
}

/** Monday of the week containing `d`, as YYYY-MM-DD in local time. */
function weekKey(d = new Date()) {
  const day = (d.getDay() + 6) % 7; // Monday = 0
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
  const mm = String(monday.getMonth() + 1).padStart(2, "0");
  const dd = String(monday.getDate()).padStart(2, "0");
  return `${monday.getFullYear()}-${mm}-${dd}`;
}

function addWeeks(key: string, n: number) {
  const [y, m, d] = key.split("-").map(Number);
  return weekKey(new Date(y, m - 1, d + n * 7));
}

function formatWeek(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/* ---------- tiny localStorage store (safe if storage is blocked) ---------- */

const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedState: PledgeState | null = null;
let storageBroken = false;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function getSnapshot(): PledgeState | null {
  if (storageBroken) return cachedState;
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cachedState = raw ? (JSON.parse(raw) as PledgeState) : null;
    } catch {
      cachedState = null;
    }
  }
  return cachedState;
}

function save(next: PledgeState | null) {
  try {
    if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable (private mode etc.): the page still works for this visit.
    storageBroken = true;
    cachedRaw = next ? JSON.stringify(next) : null;
    cachedState = next;
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && cb();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

const UNSET = Symbol("unset");

/* ---------------------------------- UI ---------------------------------- */

export function WeeklyPledge() {
  const state = useSyncExternalStore<PledgeState | null | typeof UNSET>(
    subscribe,
    getSnapshot,
    () => UNSET, // server render: we don't know yet
  );
  const [message, setMessage] = useState("");

  if (state === UNSET) {
    return <p className="text-muted">Loading your pledge…</p>;
  }

  if (!state) {
    return (
      <PledgeForm
        onSubmit={(goal) => {
          save({ goal, startedWeek: weekKey(), checkIns: {} });
          setMessage(`Pledge saved: ${goal}. Check in any time this week.`);
        }}
      />
    );
  }

  return (
    <>
      <PledgeTracker
        state={state}
        onCheckIn={(outcome) => {
          const next = { ...state, checkIns: { ...state.checkIns, [weekKey()]: outcome } };
          save(next);
          setMessage(CHECKIN_REPLIES[outcome]);
        }}
        onChangeGoal={(goal) => {
          save({ ...state, goal });
          setMessage(`Goal updated to: ${goal}. Your weeks so far are kept.`);
        }}
        onClear={() => {
          save(null);
          setMessage("Your pledge and check-ins were removed from this browser.");
        }}
      />
      <p role="status" aria-live="polite" className="mt-4 min-h-6 font-bold">
        {message}
      </p>
    </>
  );
}

const CHECKIN_REPLIES: Record<Outcome, string> = {
  kept: "Nice work. That's one more week kept.",
  partly: "Partly counts. Some days are harder than others, and you still showed up.",
  "not-this-week": "Thanks for checking in honestly. This is a rest week. Your weeks kept stay as they are, and next week is a fresh start.",
};

function PledgeForm({
  onSubmit,
  initial,
  submitLabel = "Start my pledge",
}: {
  onSubmit: (goal: string) => void;
  initial?: string;
  submitLabel?: string;
}) {
  const uid = useId();
  const isPreset = initial ? PRESET_GOALS.includes(initial) : true;
  const [choice, setChoice] = useState<string>(initial && isPreset ? initial : initial ? "custom" : PRESET_GOALS[0]);
  const [custom, setCustom] = useState(initial && !isPreset ? initial : "");
  const [error, setError] = useState("");
  const customRef = useRef<HTMLInputElement>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const goal = choice === "custom" ? custom.trim() : choice;
        if (!goal) {
          setError("Write your goal in a few words, or pick one from the list.");
          customRef.current?.focus();
          return;
        }
        setError("");
        onSubmit(goal.slice(0, 120));
      }}
    >
      <fieldset>
        <legend className="text-lg font-bold">Pick one small goal for this week</legend>
        <p className="mt-1 text-muted">Small and specific works better than big and vague.</p>
        <div className="mt-3 space-y-2">
          {[...PRESET_GOALS, "custom"].map((g) => {
            const id = `${uid}-${g}`;
            return (
              <div key={g} className="flex items-start gap-3">
                <input
                  id={id}
                  type="radio"
                  name={`${uid}-goal`}
                  value={g}
                  checked={choice === g}
                  onChange={() => setChoice(g)}
                  className="mt-1 h-5 w-5 shrink-0 accent-accent"
                />
                <label htmlFor={id}>{g === "custom" ? "My own goal" : g}</label>
              </div>
            );
          })}
        </div>
        {choice === "custom" && (
          <div className="mt-3">
            <label htmlFor={`${uid}-custom`} className="font-bold">
              My goal <span className="font-normal text-muted">(up to 120 characters)</span>
            </label>
            <input
              ref={customRef}
              id={`${uid}-custom`}
              type="text"
              maxLength={120}
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${uid}-err` : undefined}
              className="mt-1 block w-full rounded-md border-2 border-field bg-surface px-3 py-2"
            />
          </div>
        )}
        {error && (
          <p id={`${uid}-err`} className="mt-2 font-bold" role="alert">
            {error}
          </p>
        )}
      </fieldset>
      <button type="submit" className="mt-4 rounded-md bg-accent px-4 py-2 font-bold text-accent-fg hover:opacity-90">
        {submitLabel}
      </button>
    </form>
  );
}

const OUTCOME_TEXT: Record<Outcome | "none", { symbol: string; label: string; cls: string }> = {
  kept: { symbol: "✓", label: "Kept", cls: "bg-accent text-accent-fg border-accent" },
  partly: { symbol: "◐", label: "Partly", cls: "bg-accent-soft text-fg border-accent" },
  "not-this-week": { symbol: "–", label: "Rest week", cls: "bg-surface text-muted border-border" },
  none: { symbol: "·", label: "No check-in", cls: "bg-surface text-muted border-border border-dashed" },
};

function PledgeTracker({
  state,
  onCheckIn,
  onChangeGoal,
  onClear,
}: {
  state: PledgeState;
  onCheckIn: (o: Outcome) => void;
  onChangeGoal: (goal: string) => void;
  onClear: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const thisWeek = weekKey();
  const current = state.checkIns[thisWeek];

  const weeksKept = Object.values(state.checkIns).filter((o) => o === "kept" || o === "partly").length;
  const weeksCheckedIn = Object.keys(state.checkIns).length;

  // Last 8 weeks, but never before the pledge started.
  const recent: string[] = [];
  for (let i = 7; i >= 0; i--) {
    const k = addWeeks(thisWeek, -i);
    if (k >= state.startedWeek) recent.push(k);
  }

  // After closing the edit form, return focus to the goal heading (not on first load).
  const wasEditing = useRef(false);
  useEffect(() => {
    if (wasEditing.current && !editing) headingRef.current?.focus();
    wasEditing.current = editing;
  }, [editing]);

  if (editing) {
    return (
      <div>
        <PledgeForm
          initial={state.goal}
          submitLabel="Save goal"
          onSubmit={(g) => {
            onChangeGoal(g);
            setEditing(false);
          }}
        />
        <button type="button" onClick={() => setEditing(false)} className="mt-3 font-bold text-accent underline">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 ref={headingRef} tabIndex={-1} className="text-sm font-bold uppercase tracking-wide text-muted">
          My goal this week
        </h3>
        <p className="mt-1 text-xl font-bold">{state.goal}</p>
      </div>

      <fieldset>
        <legend className="font-bold">
          Week of {formatWeek(thisWeek)}: how did it go?
          {current && <span className="font-normal text-muted"> (you can change your answer)</span>}
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["kept", "partly", "not-this-week"] as Outcome[]).map((o) => (
            <button
              key={o}
              type="button"
              aria-pressed={current === o}
              onClick={() => onCheckIn(o)}
              className={`rounded-md border-2 px-4 py-2 font-bold ${
                current === o ? "border-accent bg-accent text-accent-fg" : "border-field hover:bg-accent-soft"
              }`}
            >
              {o === "kept" ? "I kept it" : o === "partly" ? "Partly" : "Not this week"}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <p className="text-lg">
          <strong>{weeksKept}</strong> {weeksKept === 1 ? "week" : "weeks"} kept or partly kept, from{" "}
          {weeksCheckedIn} {weeksCheckedIn === 1 ? "check-in" : "check-ins"}.
        </p>
        <p className="text-sm text-muted">This number only goes up. Rest weeks don&apos;t take anything away.</p>
        <ol className="mt-3 flex flex-wrap gap-2" aria-label="Recent weeks">
          {recent.map((k) => {
            const o = OUTCOME_TEXT[state.checkIns[k] ?? "none"];
            return (
              <li key={k} className={`flex w-20 flex-col items-center rounded-md border-2 px-1 py-1.5 text-center text-xs ${o.cls}`}>
                <span aria-hidden="true" className="text-lg leading-none">
                  {o.symbol}
                </span>
                <span className="font-bold">{o.label}</span>
                <span>{formatWeek(k)}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="flex flex-wrap gap-4 border-t border-border pt-4 text-sm">
        <button type="button" onClick={() => setEditing(true)} className="font-bold text-accent underline">
          Change my goal
        </button>
        {!confirmClear ? (
          <button type="button" onClick={() => setConfirmClear(true)} className="font-bold text-accent underline">
            Delete my pledge data
          </button>
        ) : (
          <span className="flex flex-wrap items-center gap-3">
            <span>Delete your goal and all check-ins from this browser?</span>
            <button type="button" onClick={onClear} className="rounded-md border-2 border-field px-3 py-1 font-bold">
              Yes, delete
            </button>
            <button type="button" onClick={() => setConfirmClear(false)} className="font-bold text-accent underline">
              Keep it
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
