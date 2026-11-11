import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DOC_PAGES, getDoc } from "@/lib/docs";

export function generateStaticParams() {
  return DOC_PAGES.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: PageProps<"/docs/[slug]">): Promise<Metadata> {
  const doc = getDoc((await params).slug);
  return doc ? { title: doc.title, description: doc.summary } : {};
}

export default async function DocPage({ params }: PageProps<"/docs/[slug]">) {
  const doc = getDoc((await params).slug);
  if (!doc) notFound();
  const { default: Content } = await doc.load();
  const i = DOC_PAGES.findIndex((d) => d.slug === doc.slug);
  const next = DOC_PAGES[i + 1];

  return (
    <article className="space-y-8">
      <nav aria-label="Breadcrumb" className="text-sm font-bold">
        <ol className="flex flex-wrap gap-2">
          <li>
            <Link href="/docs">Guides</Link>
            <span aria-hidden="true"> ›</span>
          </li>
          <li aria-current="page" className="text-muted">
            {doc.title}
          </li>
        </ol>
      </nav>
      <header className="max-w-3xl space-y-3">
        <p aria-hidden="true" className="text-5xl">
          {doc.icon}
        </p>
        <h1 className="text-4xl font-bold leading-tight sm:text-5xl">{doc.title}</h1>
        <p className="text-lg">{doc.summary}</p>
        <p className="text-sm font-bold text-muted">{doc.minutes} min read · STOIC for Android</p>
      </header>

      <div className="reading">
        <Content />
      </div>

      {next ? (
        <p className="max-w-3xl">
          <Link href={`/docs/${next.slug}`} className="font-extrabold text-brand">
            Next: {next.title} ›
          </Link>
        </p>
      ) : null}
    </article>
  );
}
