import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Let .mdx files be imported as React components (used by the how-to docs).
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  // Old hub pages (tool comparison and third-party setup guides) were replaced by STOIC's own docs.
  redirects() {
    return [
      { source: "/tools", destination: "/#features", permanent: true },
      { source: "/guides", destination: "/docs", permanent: true },
      { source: "/guides/:slug", destination: "/docs", permanent: true },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
