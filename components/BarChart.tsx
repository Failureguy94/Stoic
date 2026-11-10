import type { SurveyQuestion } from "@/data/survey";

/**
 * Accessible bar chart: it is a real <table>, so screen readers get the
 * label/count pairs, and every bar also shows its number as text.
 * Bar length is decorative (aria-hidden).
 */
export function BarChart({ q, total }: { q: SurveyQuestion; total: number }) {
  const max = Math.max(...q.answers.map((a) => a.count));
  return (
    <figure className="rounded-lg border border-border bg-surface p-4 sm:p-5">
      <table className="w-full border-collapse text-left">
        <caption className="mb-1 text-left text-lg font-bold">
          {q.question}
          <span className="block text-sm font-normal text-muted">
            {total} respondents.{q.note ? ` ${q.note}` : ""}
          </span>
        </caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Answer</th>
            <th scope="col">Number of students</th>
          </tr>
        </thead>
        <tbody>
          {q.answers.map((a) => {
            const pct = Math.round((a.count / total) * 100);
            return (
              <tr key={a.label} className="align-middle">
                <th scope="row" className="w-2/5 py-1.5 pr-3 font-normal sm:w-1/3">
                  {a.label}
                </th>
                <td className="py-1.5">
                  <div className="flex items-center gap-3">
                    <div
                      aria-hidden="true"
                      className="h-5 rounded-sm bg-accent"
                      style={{ width: `${(a.count / max) * 70}%`, minWidth: a.count ? "4px" : 0 }}
                    />
                    <span className="whitespace-nowrap font-bold">
                      {a.count}
                      <span className="font-normal text-muted"> ({pct}%)</span>
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </figure>
  );
}
