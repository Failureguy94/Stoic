import type { SurveyQuestion } from "@/data/survey";

/**
 * Accessible bar chart: a real <table>, so screen readers get each
 * label and count. Bars are decorative; every number is also shown as text.
 */
export function BarChart({ q, total, tint }: { q: SurveyQuestion; total: number; tint: string }) {
  const max = Math.max(...q.answers.map((a) => a.count));
  return (
    <figure className={`rounded-[var(--radius-blob)] ${tint} p-5`}>
      <table className="w-full border-collapse text-left">
        <caption className="mb-2 text-left">
          <span className="block font-display text-xl font-bold">{q.question}</span>
          <span className="block text-sm">
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
          {q.answers.map((a) => (
            <tr key={a.label}>
              <th scope="row" className="w-2/5 py-1.5 pr-3 align-middle font-bold">
                {a.label}
              </th>
              <td className="py-1.5 align-middle">
                <div className="flex items-center gap-2">
                  <div
                    aria-hidden="true"
                    className="h-6 rounded-full bg-brand"
                    style={{ width: `${(a.count / max) * 68}%`, minWidth: a.count ? "10px" : 0 }}
                  />
                  <span className="whitespace-nowrap font-extrabold">
                    {a.count}
                    <span className="font-normal"> ({Math.round((a.count / total) * 100)}%)</span>
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
