import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDES, getGuide } from "@/lib/guides";
import { getTool } from "@/data/tools";
import { BadgeRow, formatDate } from "@/components/Badges";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps<"/guides/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  return guide ? { title: guide.title, description: guide.summary } : {};
}

export default async function GuidePage({ params }: PageProps<"/guides/[slug]">) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const { default: Content } = await guide.load();

  return (
    <article className="space-y-8">
      <nav aria-label="Breadcrumb" className="text-sm">
        <ol className="flex flex-wrap gap-2">
          <li>
            <Link href="/guides">Guides</Link>
            <span aria-hidden="true"> /</span>
          </li>
          <li aria-current="page" className="text-muted">
            {guide.title}
          </li>
        </ol>
      </nav>

      <header className="max-w-3xl space-y-4">
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{guide.title}</h1>
        <dl className="grid gap-3 rounded-lg border border-border bg-surface p-5 sm:grid-cols-2">
          <div>
            <dt className="font-bold">Who it&apos;s for</dt>
            <dd>{guide.whoFor}</dd>
          </div>
          <div>
            <dt className="font-bold">Time needed</dt>
            <dd>{guide.timeNeeded}</dd>
          </div>
          <div>
            <dt className="font-bold">Device</dt>
            <dd>{guide.devices}</dd>
          </div>
          <div>
            <dt className="font-bold">Written and tested by</dt>
            <dd>
              {guide.author}
              {guide.lastTested ? (
                <>
                  , tested on <time dateTime={guide.lastTested}>{formatDate(guide.lastTested)}</time>
                </>
              ) : (
                <> (not yet tested)</>
              )}
            </dd>
          </div>
        </dl>
      </header>

      <div className="prose">
        <Content />
      </div>

      <section aria-labelledby="tools-in-guide" className="max-w-3xl">
        <h2 id="tools-in-guide" className="text-xl font-bold">
          Tools in this guide
        </h2>
        <ul className="mt-3 space-y-3">
          {guide.toolIds.map((id) => {
            const tool = getTool(id);
            return (
              <li key={id} className="rounded-lg border border-border bg-surface p-4">
                <p className="font-bold">{tool.name}</p>
                <div className="mt-2">
                  <BadgeRow cost={tool.cost} level={tool.permissionLevel} effort={tool.effort} />
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-4">
          <Link href="/tools" className="font-bold text-accent">
            Compare these with other tools
          </Link>
        </p>
      </section>
    </article>
  );
}
