"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { DEVICES, PICKER, PROBLEMS, type Device, type Problem } from "@/data/picker";
import { getTool } from "@/data/tools";
import { BadgeRow } from "@/components/Badges";

export function FixPicker() {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const uid = useId();

  const result = problem && device ? PICKER[problem][device] : null;
  const problemLabel = PROBLEMS.find((p) => p.id === problem)?.label;
  const deviceLabel = DEVICES.find((d) => d.id === device)?.label;

  let announcement = "";
  if (result) {
    const n = result.picks.length;
    announcement = `${n} ${n === 1 ? "tool" : "tools"} for ${problemLabel} on ${deviceLabel}, shown below.`;
  }

  return (
    <section aria-labelledby={`${uid}-h`} className="rounded-xl border border-border bg-surface p-5 sm:p-7">
      <h2 id={`${uid}-h`} className="text-2xl font-bold">
        Find your fix
      </h2>
      <p className="mt-1 text-muted">Two quick choices. Results appear straight away, below.</p>

      <form className="mt-5 grid gap-6 md:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
        <RadioGroup
          legend="1. What distracts you most?"
          name={`${uid}-problem`}
          options={PROBLEMS.map((p) => ({ value: p.id, label: p.label }))}
          value={problem}
          onChange={(v) => setProblem(v as Problem)}
        />
        <RadioGroup
          legend="2. Which device?"
          name={`${uid}-device`}
          options={DEVICES.map((d) => ({ value: d.id, label: d.label, hint: d.hint }))}
          value={device}
          onChange={(v) => setDevice(v as Device)}
        />
      </form>

      {/* Screen readers hear a short summary whenever the result changes. */}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <div className="mt-6 border-t border-border pt-6">
        {!result ? (
          <p className="text-muted">
            {problem || device
              ? `Now choose ${problem ? "a device" : "what distracts you most"} to see matching tools.`
              : "Choose one option in each group to see 2 or 3 tools that fit."}
          </p>
        ) : (
          <div>
            <h3 className="text-xl font-bold">
              For {problemLabel} on {deviceLabel}
            </h3>
            {result.picks.length === 1 && (
              <p className="mt-1 text-muted">
                Only one tool we checked really fits this, so we are not padding the list.
              </p>
            )}
            <ol className="mt-4 grid gap-4 md:grid-cols-2">
              {result.picks.map((pick, i) => {
                const tool = getTool(pick.toolId);
                return (
                  <li key={pick.toolId} className="rounded-lg border border-border p-4">
                    <h4 className="text-lg font-bold">
                      <span className="sr-only">Option {i + 1}: </span>
                      {tool.name}
                    </h4>
                    <p className="mt-1">{pick.reason}</p>
                    <div className="mt-3">
                      <BadgeRow cost={tool.cost} level={tool.permissionLevel} effort={tool.effort} />
                    </div>
                    {tool.paidFeatures.length > 0 && (
                      <p className="mt-3 text-sm">
                        <span className="font-bold">Paid: </span>
                        {tool.paidFeatures.join(", ")}.
                      </p>
                    )}
                    <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      <a href={tool.officialUrl} className="font-bold text-accent" rel="noopener noreferrer">
                        {tool.name} official page<span className="sr-only"> (external site)</span>
                      </a>
                      <Link href="/tools" className="font-bold text-accent">
                        Full comparison
                      </Link>
                    </p>
                  </li>
                );
              })}
            </ol>
            {result.guide && (
              <p className="mt-5 rounded-lg bg-accent-soft p-4">
                <span className="font-bold">Step-by-step: </span>
                <Link href={`/guides/${result.guide.slug}`} className="font-bold text-accent">
                  {result.guide.label}
                </Link>
              </p>
            )}
            <p className="mt-4 text-sm text-muted">
              Tip from our survey: tools mostly failed because people <em>forgot</em> or switched them off.
              An <strong>Automatic</strong> tool keeps working on bad days too.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function RadioGroup({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string;
  name: string;
  options: { value: string; label: string; hint?: string }[];
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-3 text-lg font-bold">{legend}</legend>
      <div className="space-y-2">
        {options.map((o) => {
          const id = `${name}-${o.value}`;
          const checked = value === o.value;
          return (
            <label
              key={o.value}
              htmlFor={id}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 px-3 py-2.5 has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ${
                checked ? "border-accent bg-accent-soft" : "border-border hover:border-field"
              }`}
            >
              <input
                id={id}
                type="radio"
                name={name}
                value={o.value}
                checked={checked}
                onChange={() => onChange(o.value)}
                className="mt-1 h-5 w-5 shrink-0 accent-accent focus-visible:outline-none"
              />
              <span>
                <span className="font-bold">{o.label}</span>
                {o.hint && <span className="block text-sm text-muted">{o.hint}</span>}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
