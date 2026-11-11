import Image from "next/image";

/* Building blocks for guide MDX files (registered in mdx-components.tsx). */

/** A highlighted to-do, so unfinished content is impossible to miss. */
export function Todo({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border-2 border-dashed border-warn-ink bg-butter px-1.5 py-0.5 font-extrabold text-warn-ink">
      {children}
    </span>
  );
}

/**
 * Screenshot slot. `alt` is required. Without `src` it shows a labelled
 * placeholder with the planned alt text.
 * Put images in public/doc-images/<doc-slug>/ and pass src="/doc-images/<slug>/<file>.png".
 */
export function Screenshot({
  src,
  alt,
  caption,
  width = 540,
  height = 1170,
}: {
  src?: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
}) {
  if (!src) {
    return (
      <figure className="my-6 max-w-sm rounded-[1.25rem] border-2 border-dashed border-warn-ink bg-butter p-4 text-warn-ink">
        <p className="font-extrabold">
          <span aria-hidden="true">🖼️ </span>[ADD SCREENSHOT]
        </p>
        <p className="mt-1 text-sm">
          <span className="font-extrabold">Planned alt text: </span>
          {alt}
        </p>
        {caption && <figcaption className="mt-2 text-sm">{caption}</figcaption>}
      </figure>
    );
  }
  return (
    <figure className="my-6 max-w-sm">
      <Image src={src} alt={alt} width={width} height={height} className="h-auto w-full rounded-[1.25rem] border-2 border-line" />
      {caption && <figcaption className="mt-2 text-sm text-muted">{caption}</figcaption>}
    </figure>
  );
}

/** The "If it didn't work" box that ends every guide. */
export function IfItDidntWork({ children }: { children: React.ReactNode }) {
  return (
    <aside aria-labelledby="didnt-work-h" className="my-10 rounded-[var(--radius-blob)] bg-peach p-6">
      <h2 id="didnt-work-h" className="!mt-0 text-2xl font-bold">
        <span aria-hidden="true">🤔 </span>If it didn&apos;t work
      </h2>
      <div className="mt-2">{children}</div>
    </aside>
  );
}

export function Note({ children }: { children: React.ReactNode }) {
  return <div className="my-5 rounded-[1.25rem] bg-sky p-4 text-info-ink">{children}</div>;
}
