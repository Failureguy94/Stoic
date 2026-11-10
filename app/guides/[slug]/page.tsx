import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDES, getGuide } from "@/lib/guides";
import { getTool } from "@/data/tools";
import { TagRow, formatDate } from "@/components/Tags";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps<"/guides/[slug]">): Promise<Metadata> {
  const guide = getGuide((await params).slug);
  return guide ? { title: guide.title, description: guide.summary } : {};
}

export default async function GuidePage({ params }: PageProps<"/guides/[slug]">) {
  const guide = getGuide((await params).slug);
  if (!guide) notFound();
  const { default: Content } = await guide.load();

  const facts = [
    { icon: "🙋", term: "Who it's for", value: guide.whoFor, tint: "bg-mint" },
    { icon: "⏱️", term: "Time needed", value: guide.timeNeeded, tint: "bg-butter" },
    { icon: "📱", term: "Device", value: guide.devices, tint: "bg-sky" },
    {
      icon: "✍️",
      term: "Written and tested by",
      value: guide.lastTested ? (
        <>
          {guide.author}, tested <time dateTime={guide.lastTested}>{formatDate(guide.lastTested)}</time>
        </>
      ) : (
        <>{guide.author} (not tested yet)</>
      ),
      tint: "bg-peach",
    },
  ];

  return (
    <article className="space-y-8">
      <nav aria-label="Breadcrumb" className="text-sm font-bold">
        <ol className="flex flex-wrap gap-2">
          <li>
            <Link href="/guides">Guides</Link>
            <span aria-hidden="true"> ›</span>
          </li>
          <li aria-current="page" className="text-muted">
            {guide.title}
          </li>
        </ol>
      </nav>
      <header className="max-w-3xl space-y-5">
        <h1 className="text-4xl font-bold leading-tight sm:text-5xl">{guide.title}</h1>
        <dl className="grid gap-3 sm:grid-cols-2">
          {facts.map((f) => (
            <div key={f.term} className={`rounded-[1.25rem] ${f.tint} p-4`}>
              <dt className="font-extrabold">
                <span aria-hidden="true">{f.icon} </span>
                {f.term}
              </dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="reading">
        <Content />
      </div>

      <section aria-labelledby="tools-in-guide" className="max-w-3xl">
        <h2 id="tools-in-guide" className="text-2xl font-bold">
          Tools in this guide
        </h2>
        <ul className="mt-3 space-y-3">
          {guide.toolIds.map((id) => {
            const tool = getTool(id);
            return (
              <li key={id} className="rounded-[1.25rem] border-2 border-line bg-surface p-4">
                <p className="font-display text-lg font-bold">{tool.name}</p>
                <div className="mt-2">
                  <TagRow cost={tool.cost} level={tool.permissionLevel} effort={tool.effort} />
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-4">
          <Link href="/tools" className="font-extrabold text-brand">
            Compare these with other tools
          </Link>
        </p>
      </section>
    </article>
  );
}
