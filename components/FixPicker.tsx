"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { DEVICES, PICKER, PROBLEMS, type Device, type Problem } from "@/data/picker";
import { getTool } from "@/data/tools";
import { TagRow } from "@/components/Tags";
import { Pebble } from "@/components/Pebble";

const PROBLEM_ICON: Record<Problem, string> = {
  "youtube-reels": "📺",
  "social-media": "💬",
  notifications: "🔔",
  "late-night": "🌙",
  games: "🎮",
};
const DEVICE_ICON: Record<Device, string> = { android: "📱", iphone: "📱", laptop: "💻" };
const CARD_TINTS = ["bg-peach", "bg-mint", "bg-sky"];

export function FixPicker() {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const uid = useId();

  const result = problem && device ? PICKER[problem][device] : null;
  const problemLabel = PROBLEMS.find((p) => p.id === problem)?.label;
  const deviceLabel = DEVICES.find((d) => d.id === device)?.label;
  const announcement = result
    ? `${result.picks.length} ${result.picks.length === 1 ? "tool" : "tools"} for ${problemLabel} on ${deviceLabel}, shown below.`
    : "";

  return (
    <section
      aria-labelledby={`${uid}-h`}
      className="rounded-[var(--radius-blob)] border-2 border-line bg-surface p-5 sm:p-8"
    >
      <h2 id={`${uid}-h`} className="text-3xl font-bold">
        Find your fix
      </h2>
      <p className="mt-1 text-muted">Two taps. Your matches appear straight away, just below.</p>

      <form className="mt-6 space-y-7" onSubmit={(e) => e.preventDefault()}>
        <ChipGroup
          step="1"
          legend="What eats your study time most?"
          name={`${uid}-problem`}
          options={PROBLEMS.map((p) => ({ value: p.id, label: p.label, icon: PROBLEM_ICON[p.id] }))}
          value={problem}
          onChange={(v) => setProblem(v as Problem)}
        />
        <ChipGroup
          step="2"
          legend="Which device?"
          name={`${uid}-device`}
          options={DEVICES.map((d) => ({ value: d.id, label: d.label, icon: DEVICE_ICON[d.id], hint: d.hint }))}
          value={device}
          onChange={(v) => setDevice(v as Device)}
        />
      </form>

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <div className="mt-8 rounded-[1.25rem] bg-lavender p-5 sm:p-6">
        {!result ? (
          <div className="flex items-center gap-4">
            <Pebble mood="calm" size={70} className="shrink-0" />
            <p className="font-bold">
              {problem || device
                ? `Nice! Now pick ${problem ? "your device" : "what distracts you most"}.`
                : "Pick one in each row and I'll show you 2 or 3 tools that fit."}
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3">
              <Pebble mood="happy" size={56} className="shrink-0" />
              <h3 className="text-2xl font-bold">
                <span className="text-base font-bold text-muted">Step 3 · </span>
                Your fix for {problemLabel} on {deviceLabel}
              </h3>
            </div>
            {result.picks.length === 1 && (
              <p className="mt-2">Only one tool we checked really fits this, so we&apos;re not padding the list.</p>
            )}
            <ol className="mt-5 grid gap-4 md:grid-cols-2">
              {result.picks.map((pick, i) => {
                const tool = getTool(pick.toolId);
                return (
                  <li key={pick.toolId} className="pop overflow-hidden rounded-[1.25rem] border-2 border-line bg-surface">
                    <div className={`${CARD_TINTS[i % 3]} px-4 py-2 font-display text-sm font-bold`}>
                      Option {i + 1}
                    </div>
                    <div className="p-4">
                      <h4 className="text-xl font-bold">{tool.name}</h4>
                      <p className="mt-1">{pick.reason}</p>
                      <div className="mt-3">
                        <TagRow cost={tool.cost} level={tool.permissionLevel} effort={tool.effort} />
                      </div>
                      {tool.paidFeatures.length > 0 && (
                        <p className="mt-3 text-sm">
                          <span className="font-extrabold">Paid: </span>
                          {tool.paidFeatures.join(", ")}.
                        </p>
                      )}
                      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm font-bold">
                        <a href={tool.officialUrl} className="text-brand" rel="noopener noreferrer">
                          {tool.name} official page<span className="sr-only"> (external site)</span>
                        </a>
                        <Link href="/tools" className="text-brand">
                          Full comparison
                        </Link>
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
            {result.guide && (
              <p className="mt-5 rounded-full bg-surface px-5 py-3 font-bold">
                <span aria-hidden="true">📘 </span>Step-by-step:{" "}
                <Link href={`/guides/${result.guide.slug}`} className="text-brand">
                  {result.guide.label}
                </Link>
              </p>
            )}
            <p className="mt-4 text-sm">
              <span className="font-extrabold">Tip from your batch:</span> tools mostly failed because people forgot
              or switched them off. An <strong>Automatic</strong> one keeps going on lazy days too.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function ChipGroup({
  step,
  legend,
  name,
  options,
  value,
  onChange,
}: {
  step: string;
  legend: string;
  name: string;
  options: { value: string; label: string; icon: string; hint?: string }[];
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-3 flex items-center gap-3 font-display text-xl font-bold">
        <span
          aria-hidden="true"
          className="grid h-8 w-8 place-items-center rounded-full bg-brand text-base text-brand-ink"
        >
          {step}
        </span>
        <span>
          <span className="sr-only">Step {step}: </span>
          {legend}
        </span>
      </legend>
      <div className="flex flex-wrap gap-2.5">
        {options.map((o) => {
          const id = `${name}-${o.value}`;
          const checked = value === o.value;
          return (
            <label
              key={o.value}
              htmlFor={id}
              className={`pop flex cursor-pointer items-center gap-2.5 rounded-full border-2 px-4 py-2.5 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus has-[:focus-visible]:outline ${
                checked ? "border-brand bg-brand text-brand-ink" : "border-line bg-surface hover:border-field"
              }`}
            >
              <input
                id={id}
                type="radio"
                name={name}
                value={o.value}
                checked={checked}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              <span aria-hidden="true" className="text-xl leading-none">
                {o.icon}
              </span>
              <span>
                <span className="font-extrabold">{o.label}</span>
                {o.hint && (
                  <span className={`block text-xs ${checked ? "" : "text-muted"}`}>{o.hint}</span>
                )}
                {checked && <span aria-hidden="true"> ✓</span>}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
