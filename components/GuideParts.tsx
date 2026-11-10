import Image from "next/image";

/**
 * Building blocks used inside the guide MDX files.
 * They are registered globally in mdx-components.tsx.
 */

/** Shows a highlighted to-do so unfinished content is impossible to miss. */
export function Todo({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded border-2 border-dashed border-note-border bg-note-bg px-1.5 py-0.5 font-bold">
      {children}
    </span>
  );
}

/**
 * A screenshot slot. `alt` is required. Until `src` is added it renders a
 * clearly labelled placeholder that shows the planned alt text.
 * Put images in public/guides/<guide-slug>/ and pass src="/guides/<slug>/<file>.png".
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
      <figure className="my-6 max-w-sm rounded-lg border-2 border-dashed border-note-border bg-note-bg p-4">
        <p className="font-bold">[ADD SCREENSHOT]</p>
        <p className="mt-1 text-sm">
          <span className="font-bold">Planned alt text: </span>
          {alt}
        </p>
        {caption && <figcaption className="mt-2 text-sm">{caption}</figcaption>}
      </figure>
    );
  }
  return (
    <figure className="my-6 max-w-sm">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="h-auto w-full rounded-lg border border-border"
      />
      {caption && <figcaption className="mt-2 text-sm text-muted">{caption}</figcaption>}
    </figure>
  );
}

/** The "If it didn't work" box that ends every guide. */
export function IfItDidntWork({ children }: { children: React.ReactNode }) {
  return (
    <aside
      aria-labelledby="didnt-work-h"
      className="my-8 rounded-lg border-l-4 border-note-border bg-note-bg p-5"
    >
      <h2 id="didnt-work-h" className="!mt-0 text-xl font-bold">
        If it didn&apos;t work
      </h2>
      <div className="mt-2">{children}</div>
    </aside>
  );
}

/** A short supportive note. */
export function Note({ children }: { children: React.ReactNode }) {
  return <div className="my-5 rounded-lg bg-info-bg p-4 text-info-fg">{children}</div>;
}
