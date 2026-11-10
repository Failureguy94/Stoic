"use client";

import { useId, useMemo, useState } from "react";
import { PLATFORM_LABELS, PURPOSE_LABELS, tools, type Platform, type Purpose, type Tool } from "@/data/tools";
import { CostTag, EffortTag, PermissionTag, formatDate } from "@/components/Tags";
import { Pebble } from "@/components/Pebble";

type PlatformFilter = Platform | "all";
type PurposeFilter = Purpose | "all";
const TINTS = ["bg-peach", "bg-mint", "bg-sky", "bg-butter", "bg-lavender", "bg-rose"];

export function CompareTools() {
  const [platform, setPlatform] = useState<PlatformFilter>("all");
  const [purpose, setPurpose] = useState<PurposeFilter>("all");
  const [freeOnly, setFreeOnly] = useState(false);
  const uid = useId();

  const filtered = useMemo(
    () =>
      tools.filter(
        (t) =>
          (platform === "all" || t.platforms.includes(platform)) &&
          (purpose === "all" || t.purpose.includes(purpose)) &&
          (!freeOnly || t.cost === "free"),
      ),
    [platform, purpose, freeOnly],
  );

  const reset = () => {
    setPlatform("all");
    setPurpose("all");
    setFreeOnly(false);
  };

  return (
    <div>
      <form
        onSubmit={(e) => e.preventDefault()}
        className="space-y-5 rounded-[var(--radius-blob)] border-2 border-line bg-surface p-5 sm:p-6"
      >
        <h2 className="text-xl font-bold">Filter the list</h2>
        <ChipRadios
          legend="Platform"
          name={`${uid}-platform`}
          value={platform}
          onChange={(v) => setPlatform(v as PlatformFilter)}
          options={[{ value: "all", label: "All" }, ...Object.entries(PLATFORM_LABELS).map(([value, label]) => ({ value, label }))]}
        />
        <ChipRadios
          legend="Purpose"
          name={`${uid}-purpose`}
          value={purpose}
          onChange={(v) => setPurpose(v as PurposeFilter)}
          options={[{ value: "all", label: "All" }, ...Object.entries(PURPOSE_LABELS).map(([value, label]) => ({ value, label }))]}
        />
        <div>
          <label
            htmlFor={`${uid}-free`}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-full border-2 px-4 py-2 font-extrabold has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ${
              freeOnly ? "border-good-ink bg-mint text-good-ink" : "border-line"
            }`}
          >
            <input
              id={`${uid}-free`}
              type="checkbox"
              checked={freeOnly}
              onChange={(e) => setFreeOnly(e.target.checked)}
              className="h-5 w-5 accent-[var(--good-ink)]"
            />
            Free only <span className="font-normal">(no paid tier needed)</span>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-4 border-t-2 border-dashed border-line pt-4">
          <p role="status" aria-live="polite" className="font-display text-lg font-bold">
            Showing {filtered.length} of {tools.length} tools
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-full border-2 border-field px-4 py-1.5 font-bold hover:bg-lavender"
          >
            Reset filters
          </button>
        </div>
      </form>

      {filtered.length === 0 ? (
        <div className="mt-6 flex items-center gap-4 rounded-[var(--radius-blob)] bg-lavender p-6">
          <Pebble mood="sleepy" size={80} className="shrink-0" />
          <p className="font-bold">
            Hmm, nothing matches all of those.{" "}
            <button type="button" onClick={reset} className="text-brand underline">
              Reset the filters
            </button>{" "}
            and try a wider search.
          </p>
        </div>
      ) : (
        <>
          <ToolTable rows={filtered} />
          <ToolCards rows={filtered} />
        </>
      )}
    </div>
  );
}

function ChipRadios({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string;
  name: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 font-extrabold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const id = `${name}-${o.value}`;
          const checked = value === o.value;
          return (
            <label
              key={o.value}
              htmlFor={id}
              className={`cursor-pointer rounded-full border-2 px-3.5 py-1.5 font-bold has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ${
                checked ? "border-brand bg-brand text-brand-ink" : "border-line hover:border-field"
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
              {checked && <span aria-hidden="true">✓ </span>}
              {o.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}

function Cost({ tool }: { tool: Tool }) {
  return (
    <div className="space-y-2">
      <CostTag cost={tool.cost} />
      <p>{tool.priceNote}</p>
      {tool.paidFeatures.length > 0 && (
        <div>
          <p className="font-extrabold">Paid features:</p>
          <List items={tool.paidFeatures} />
        </div>
      )}
    </div>
  );
}

function Privacy({ tool }: { tool: Tool }) {
  return (
    <div className="space-y-2">
      <PermissionTag level={tool.permissionLevel} />
      <p>{tool.permissions}</p>
      <p>
        <span className="font-extrabold">Privacy: </span>
        {tool.privacyNotes}
      </p>
    </div>
  );
}

function Effort({ tool }: { tool: Tool }) {
  return (
    <div className="space-y-2">
      <EffortTag effort={tool.effort} />
      <p>{tool.effortNote}</p>
    </div>
  );
}

function Official({ tool }: { tool: Tool }) {
  return (
    <a href={tool.officialUrl} className="font-extrabold text-brand" rel="noopener noreferrer">
      {tool.name} official page<span className="sr-only"> (external site)</span>
    </a>
  );
}

const platforms = (t: Tool) => t.platforms.map((p) => PLATFORM_LABELS[p]).join(", ");
const purposes = (t: Tool) => t.purpose.map((p) => PURPOSE_LABELS[p]).join(", ");

function ToolTable({ rows }: { rows: Tool[] }) {
  const headers = [
    "Tool",
    "Purpose",
    "Platforms",
    "Cost",
    "Permissions and privacy",
    "Effort",
    "Accessibility notes",
    "Limitations",
    "Official link",
    "Date checked",
  ];
  return (
    <div
      className="relative mt-6 hidden overflow-x-auto rounded-[var(--radius-blob)] border-2 border-line bg-surface lg:block"
      role="region"
      aria-label="Tool comparison table, scrolls sideways"
      tabIndex={0}
    >
      <table className="w-full min-w-[1320px] border-collapse text-left text-[0.92rem]">
        <caption className="p-5 text-left font-display text-xl font-bold">
          {rows.length} digital wellness tools compared. Details checked on official pages on the date in the last
          column.
        </caption>
        <thead>
          <tr className="bg-lavender">
            {headers.map((h) => (
              <th
                key={h}
                scope="col"
                className={`p-3 align-bottom font-extrabold ${h === "Tool" ? "sticky left-0 z-10 bg-lavender" : ""}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id} className="border-t-2 border-line align-top">
              <th
                scope="row"
                className="sticky left-0 z-10 w-40 bg-surface p-3 font-display text-base font-bold shadow-[2px_0_0_var(--line)]"
              >
                {t.name}
              </th>
              <td className="w-56 p-3">
                <p>{t.summary}</p>
                <p className="mt-2 text-muted">{purposes(t)}</p>
              </td>
              <td className="p-3">{platforms(t)}</td>
              <td className="w-60 p-3">
                <Cost tool={t} />
              </td>
              <td className="w-64 p-3">
                <Privacy tool={t} />
              </td>
              <td className="w-44 p-3">
                <Effort tool={t} />
              </td>
              <td className="w-48 p-3">{t.accessibilityNotes}</td>
              <td className="w-64 p-3">
                <List items={t.limitations} />
              </td>
              <td className="p-3">
                <Official tool={t} />
              </td>
              <td className="p-3 whitespace-nowrap">
                <time dateTime={t.dateChecked}>{formatDate(t.dateChecked)}</time>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ToolCards({ rows }: { rows: Tool[] }) {
  return (
    <ul className="mt-6 space-y-5 lg:hidden" aria-label="Tools">
      {rows.map((t, i) => (
        <li key={t.id}>
          <article
            aria-labelledby={`card-${t.id}`}
            className="overflow-hidden rounded-[var(--radius-blob)] border-2 border-line bg-surface"
          >
            <div className={`${TINTS[i % TINTS.length]} px-5 py-4`}>
              <h2 id={`card-${t.id}`} className="text-2xl font-bold">
                {t.name}
              </h2>
              <p className="mt-1">{t.summary}</p>
            </div>
            <dl className="space-y-4 p-5">
              <Row term="Purpose">{purposes(t)}</Row>
              <Row term="Platforms">{platforms(t)}</Row>
              <Row term="Cost">
                <Cost tool={t} />
              </Row>
              <Row term="Permissions and privacy">
                <Privacy tool={t} />
              </Row>
              <Row term="Effort">
                <Effort tool={t} />
              </Row>
              <Row term="Accessibility notes">{t.accessibilityNotes}</Row>
              <Row term="Limitations">
                <List items={t.limitations} />
              </Row>
              <Row term="Official link">
                <Official tool={t} />
              </Row>
              <Row term="Date checked">
                <time dateTime={t.dateChecked}>{formatDate(t.dateChecked)}</time>
              </Row>
            </dl>
          </article>
        </li>
      ))}
    </ul>
  );
}

function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-extrabold text-muted">{term}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}
