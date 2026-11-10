"use client";

import { useId, useMemo, useState } from "react";
import {
  PLATFORM_LABELS,
  PURPOSE_LABELS,
  tools,
  type Platform,
  type Purpose,
  type Tool,
} from "@/data/tools";
import { CostBadge, EffortBadge, PermissionBadge, formatDate } from "@/components/Badges";

type PlatformFilter = Platform | "all";
type PurposeFilter = Purpose | "all";

const selectClass =
  "mt-1 block w-full rounded-md border-2 border-field bg-surface px-3 py-2 text-fg";

export function CompareTools() {
  const [platform, setPlatform] = useState<PlatformFilter>("all");
  const [purpose, setPurpose] = useState<PurposeFilter>("all");
  const [freeOnly, setFreeOnly] = useState(false);
  const ids = { platform: useId(), purpose: useId(), free: useId(), status: useId() };

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
        className="rounded-lg border border-border bg-surface p-4 sm:p-5"
        aria-describedby={ids.status}
        onSubmit={(e) => e.preventDefault()}
      >
        <fieldset>
          <legend className="text-lg font-bold">Filter tools</legend>
          <div className="mt-3 grid gap-4 sm:grid-cols-3 sm:items-end">
            <div>
              <label htmlFor={ids.platform} className="font-bold">
                Platform
              </label>
              <select
                id={ids.platform}
                className={selectClass}
                value={platform}
                onChange={(e) => setPlatform(e.target.value as PlatformFilter)}
              >
                <option value="all">All platforms</option>
                {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={ids.purpose} className="font-bold">
                Purpose
              </label>
              <select
                id={ids.purpose}
                className={selectClass}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value as PurposeFilter)}
              >
                <option value="all">All purposes</option>
                {Object.entries(PURPOSE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 py-2">
              <input
                id={ids.free}
                type="checkbox"
                className="h-5 w-5 accent-accent"
                checked={freeOnly}
                onChange={(e) => setFreeOnly(e.target.checked)}
              />
              <label htmlFor={ids.free} className="font-bold">
                Free only <span className="font-normal text-muted">(no paid tier needed)</span>
              </label>
            </div>
          </div>
        </fieldset>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <p id={ids.status} role="status" aria-live="polite" className="font-bold">
            Showing {filtered.length} of {tools.length} tools
          </p>
          <button
            type="button"
            onClick={reset}
            className="rounded-md border-2 border-field px-3 py-1.5 font-bold hover:bg-accent-soft"
          >
            Reset filters
          </button>
        </div>
      </form>

      {filtered.length === 0 ? (
        <p className="mt-6 rounded-lg border border-border bg-surface p-4">
          No tool matches all three filters. Try{" "}
          <button type="button" onClick={reset} className="font-bold text-accent underline">
            resetting the filters
          </button>
          .
        </p>
      ) : (
        <>
          <ToolTable rows={filtered} />
          <ToolCards rows={filtered} />
        </>
      )}
    </div>
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

function CostCell({ tool }: { tool: Tool }) {
  return (
    <div className="space-y-2">
      <CostBadge cost={tool.cost} />
      <p>{tool.priceNote}</p>
      {tool.paidFeatures.length > 0 && (
        <div>
          <p className="font-bold">Paid features:</p>
          <List items={tool.paidFeatures} />
        </div>
      )}
    </div>
  );
}

function PrivacyCell({ tool }: { tool: Tool }) {
  return (
    <div className="space-y-2">
      <PermissionBadge level={tool.permissionLevel} />
      <p>{tool.permissions}</p>
      <p>
        <span className="font-bold">Privacy: </span>
        {tool.privacyNotes}
      </p>
    </div>
  );
}

function OfficialLink({ tool }: { tool: Tool }) {
  return (
    <a href={tool.officialUrl} className="font-bold text-accent" rel="noopener noreferrer">
      {tool.name} official page
      <span className="sr-only"> (external site)</span>
    </a>
  );
}

/** Desktop: a real data table with caption, column and row headers. */
function ToolTable({ rows }: { rows: Tool[] }) {
  return (
    <div
      className="mt-6 hidden overflow-x-auto rounded-lg border border-border bg-surface lg:block"
      role="region"
      aria-label="Tool comparison table, scrolls sideways"
      tabIndex={0}
    >
      <table className="w-full min-w-[1200px] border-collapse text-left text-[0.95rem] align-top">
        <caption className="p-4 text-left text-lg font-bold">
          Comparison of {rows.length} digital wellness tools. Details were checked on official pages
          on the date in the last column.
        </caption>
        <thead>
          <tr className="border-y-2 border-fg/70 bg-accent-soft">
            {[
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
            ].map((h) => (
              <th key={h} scope="col" className="p-3 align-bottom font-bold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={t.id} className="border-b border-border align-top">
              <th scope="row" className="w-40 p-3 font-bold">
                {t.name}
              </th>
              <td className="w-56 p-3">
                <p>{t.summary}</p>
                <p className="mt-2 text-muted">{t.purpose.map((p) => PURPOSE_LABELS[p]).join(", ")}</p>
              </td>
              <td className="p-3">{t.platforms.map((p) => PLATFORM_LABELS[p]).join(", ")}</td>
              <td className="w-60 p-3">
                <CostCell tool={t} />
              </td>
              <td className="w-64 p-3">
                <PrivacyCell tool={t} />
              </td>
              <td className="w-44 p-3">
                <EffortBadge effort={t.effort} />
                <p className="mt-2">{t.effortNote}</p>
              </td>
              <td className="w-48 p-3">{t.accessibilityNotes}</td>
              <td className="w-64 p-3">
                <List items={t.limitations} />
              </td>
              <td className="p-3">
                <OfficialLink tool={t} />
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

/** Mobile and tablet: one card per tool, using a description list. */
function ToolCards({ rows }: { rows: Tool[] }) {
  return (
    <ul className="mt-6 space-y-5 lg:hidden" aria-label="Tools">
      {rows.map((t) => (
        <li key={t.id}>
          <article className="rounded-lg border border-border bg-surface p-4 sm:p-5" aria-labelledby={`card-${t.id}`}>
            <h2 id={`card-${t.id}`} className="text-xl font-bold">
              {t.name}
            </h2>
            <p className="mt-1">{t.summary}</p>
            <dl className="mt-4 space-y-4">
              <Row term="Purpose">{t.purpose.map((p) => PURPOSE_LABELS[p]).join(", ")}</Row>
              <Row term="Platforms">{t.platforms.map((p) => PLATFORM_LABELS[p]).join(", ")}</Row>
              <Row term="Cost">
                <CostCell tool={t} />
              </Row>
              <Row term="Permissions and privacy">
                <PrivacyCell tool={t} />
              </Row>
              <Row term="Effort">
                <EffortBadge effort={t.effort} />
                <p className="mt-2">{t.effortNote}</p>
              </Row>
              <Row term="Accessibility notes">{t.accessibilityNotes}</Row>
              <Row term="Limitations">
                <List items={t.limitations} />
              </Row>
              <Row term="Official link">
                <OfficialLink tool={t} />
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
      <dt className="font-bold text-muted">{term}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}
