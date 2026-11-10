"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import {
  getPledge,
  setPledge,
  shiftWeek,
  subscribe,
  weekLabel,
  weekOf,
  type Outcome,
  type Pledge,
} from "@/lib/pledgeStore";
import { Pebble } from "@/components/Pebble";

/* Tone rules: no shame, no failure messages, a missed week never resets anything. */

export const GOAL_IDEAS = [
  "No phone for the first 30 minutes of study",
  "Phone in another room while I study",
  "No reels or shorts after 11 pm",
  "Notifications off during lectures and study",
  "One app timer, and I don't delete it",
];

const REPLIES: Record<Outcome, string> = {
  kept: "Yay! That's one more week kept.",
  partly: "Partly counts! Some days are harder, and you still showed up.",
  rest: "Thanks for being honest. Call it a rest week. Nothing is lost, and next week is a fresh start.",
};

const WEEK_LOOK: Record<Outcome | "none", { symbol: string; label: string; cls: string }> = {
  kept: { symbol: "★", label: "Kept", cls: "bg-mint text-good-ink border-good-ink" },
  partly: { symbol: "◐", label: "Partly", cls: "bg-butter text-warn-ink border-warn-ink" },
  rest: { symbol: "☾", label: "Rest week", cls: "bg-lavender text-ink border-line" },
  none: { symbol: "·", label: "No check-in", cls: "bg-surface text-muted border-line border-dashed" },
};

const SERVER = Symbol("server");

export function WeeklyPledge() {
  const pledge = useSyncExternalStore<Pledge | null | typeof SERVER>(subscribe, getPledge, () => SERVER);
  const [message, setMessage] = useState("");
  const [mood, setMood] = useState<"calm" | "happy" | "cheer" | "sleepy">("calm");

  if (pledge === SERVER) return <p className="text-muted">Loading your pledge…</p>;

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_auto]">
      <div>
        {!pledge ? (
          <GoalForm
            submitLabel="Start my pledge"
            onSubmit={(goal) => {
              setPledge({ goal, startedWeek: weekOf(), checkIns: {} });
              setMood("happy");
              setMessage(`Pledge saved: “${goal}”. Check in any time this week.`);
            }}
          />
        ) : (
          <Tracker
            pledge={pledge}
            onCheckIn={(o) => {
              setPledge({ ...pledge, checkIns: { ...pledge.checkIns, [weekOf()]: o } });
              setMood(o === "kept" ? "cheer" : o === "partly" ? "happy" : "sleepy");
              setMessage(REPLIES[o]);
            }}
            onChangeGoal={(goal) => {
              setPledge({ ...pledge, goal });
              setMood("happy");
              setMessage(`Goal updated to “${goal}”. Your weeks so far are kept.`);
            }}
            onDelete={() => {
              setPledge(null);
              setMood("calm");
              setMessage("Your pledge and check-ins were removed from this browser.");
            }}
          />
        )}
        <p role="status" aria-live="polite" className="mt-5 min-h-7 font-display text-lg font-bold">
          {message}
        </p>
      </div>
      <div className="hidden md:block">
        <Pebble mood={mood} size={150} float />
      </div>
    </div>
  );
}

function GoalForm({
  onSubmit,
  initial,
  submitLabel,
}: {
  onSubmit: (goal: string) => void;
  initial?: string;
  submitLabel: string;
}) {
  const uid = useId();
  const startsCustom = !!initial && !GOAL_IDEAS.includes(initial);
  const [choice, setChoice] = useState(startsCustom ? "custom" : initial ?? GOAL_IDEAS[0]);
  const [custom, setCustom] = useState(startsCustom ? initial! : "");
  const [error, setError] = useState("");
  const textRef = useRef<HTMLInputElement>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const goal = (choice === "custom" ? custom : choice).trim();
        if (!goal) {
          setError("Write your goal in a few words, or pick one of the ideas.");
          textRef.current?.focus();
          return;
        }
        setError("");
        onSubmit(goal.slice(0, 120));
      }}
    >
      <fieldset>
        <legend className="font-display text-xl font-bold">Pick one small goal for this week</legend>
        <p className="mt-1 text-muted">Small and specific beats big and vague.</p>
        <div className="mt-4 flex flex-col gap-2">
          {[...GOAL_IDEAS, "custom"].map((g) => {
            const id = `${uid}-opt-${g}`;
            const checked = choice === g;
            return (
              <label
                key={g}
                htmlFor={id}
                className={`flex cursor-pointer items-center gap-3 rounded-full border-2 px-4 py-2.5 font-bold has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ${
                  checked ? "border-brand bg-lavender" : "border-line hover:border-field"
                }`}
              >
                <input
                  id={id}
                  type="radio"
                  name={`${uid}-goal`}
                  checked={checked}
                  onChange={() => setChoice(g)}
                  className="h-5 w-5 shrink-0 accent-[var(--brand)]"
                />
                {g === "custom" ? "✏️ My own goal" : g}
              </label>
            );
          })}
        </div>
        {choice === "custom" && (
          <div className="mt-4">
            <label htmlFor={`${uid}-text`} className="font-extrabold">
              My goal <span className="font-normal text-muted">(up to 120 characters)</span>
            </label>
            <input
              ref={textRef}
              id={`${uid}-text`}
              type="text"
              maxLength={120}
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${uid}-err` : undefined}
              className="mt-1 block w-full rounded-full border-2 border-field bg-surface px-4 py-2.5"
            />
          </div>
        )}
        {error && (
          <p id={`${uid}-err`} role="alert" className="mt-3 font-extrabold text-alert-ink">
            {error}
          </p>
        )}
      </fieldset>
      <button
        type="submit"
        className="pop mt-5 rounded-full bg-brand px-6 py-3 font-display text-lg font-bold text-brand-ink"
      >
        {submitLabel}
      </button>
    </form>
  );
}

function Tracker({
  pledge,
  onCheckIn,
  onChangeGoal,
  onDelete,
}: {
  pledge: Pledge;
  onCheckIn: (o: Outcome) => void;
  onChangeGoal: (goal: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const goalRef = useRef<HTMLHeadingElement>(null);
  const wasEditing = useRef(false);

  // Return focus to the goal heading after editing (but not on first load).
  useEffect(() => {
    if (wasEditing.current && !editing) goalRef.current?.focus();
    wasEditing.current = editing;
  }, [editing]);

  const thisWeek = weekOf();
  const current = pledge.checkIns[thisWeek];
  const kept = Object.values(pledge.checkIns).filter((o) => o !== "rest").length;
  const checkIns = Object.keys(pledge.checkIns).length;
  const recent = Array.from({ length: 8 }, (_, i) => shiftWeek(thisWeek, i - 7)).filter((k) => k >= pledge.startedWeek);

  if (editing) {
    return (
      <div>
        <GoalForm
          initial={pledge.goal}
          submitLabel="Save goal"
          onSubmit={(g) => {
            onChangeGoal(g);
            setEditing(false);
          }}
        />
        <button type="button" onClick={() => setEditing(false)} className="mt-3 font-bold text-brand underline">
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[1.25rem] bg-lavender p-5">
        <h3 ref={goalRef} tabIndex={-1} className="text-sm font-extrabold uppercase tracking-wider text-muted">
          My goal this week
        </h3>
        <p className="mt-1 font-display text-2xl font-bold">{pledge.goal}</p>
      </div>

      <fieldset>
        <legend className="font-extrabold">
          Week of {weekLabel(thisWeek)}: how did it go?
          {current && <span className="font-normal text-muted"> (you can change your answer)</span>}
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              ["kept", "★ I kept it"],
              ["partly", "◐ Partly"],
              ["rest", "☾ Not this week"],
            ] as [Outcome, string][]
          ).map(([o, label]) => (
            <button
              key={o}
              type="button"
              aria-pressed={current === o}
              onClick={() => onCheckIn(o)}
              className={`pop rounded-full border-2 px-5 py-2.5 font-extrabold ${
                current === o ? "border-brand bg-brand text-brand-ink" : "border-field bg-surface hover:bg-lavender"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <p className="text-lg">
          <strong className="font-display text-3xl">{kept}</strong> {kept === 1 ? "week" : "weeks"} kept or partly
          kept, from {checkIns} {checkIns === 1 ? "check-in" : "check-ins"}.
        </p>
        <p className="text-sm text-muted">This number only goes up. Rest weeks never take anything away.</p>
        <ol className="mt-3 flex flex-wrap gap-2" aria-label="Recent weeks">
          {recent.map((k) => {
            const look = WEEK_LOOK[pledge.checkIns[k] ?? "none"];
            return (
              <li
                key={k}
                className={`flex w-20 flex-col items-center rounded-2xl border-2 px-1 py-2 text-center text-xs ${look.cls}`}
              >
                <span aria-hidden="true" className="text-lg leading-none">
                  {look.symbol}
                </span>
                <span className="font-extrabold">{look.label}</span>
                <span>{weekLabel(k)}</span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t-2 border-dashed border-line pt-4 text-sm font-bold">
        <button type="button" onClick={() => setEditing(true)} className="text-brand underline">
          Change my goal
        </button>
        {!confirmDelete ? (
          <button type="button" onClick={() => setConfirmDelete(true)} className="text-brand underline">
            Delete my pledge data
          </button>
        ) : (
          <span className="flex flex-wrap items-center gap-3">
            <span>Delete your goal and all check-ins from this browser?</span>
            <button type="button" onClick={onDelete} className="rounded-full border-2 border-field px-3 py-1">
              Yes, delete
            </button>
            <button type="button" onClick={() => setConfirmDelete(false)} className="text-brand underline">
              Keep it
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
