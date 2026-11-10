// Turns the website's guide files (../content/guides/*.mdx) into JSON the app can render.
// The MDX files stay the single place to write guides: edit them, then run `npm run guides`
// (it also runs automatically before `npm start` and `npm run android`).
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import { unified } from "unified";

const here = dirname(fileURLToPath(import.meta.url));
const SRC = join(here, "../../content/guides");
const OUT = join(here, "../src/generated/guides.json");

const parser = unified().use(remarkParse).use(remarkMdx);

const attr = (node, name) => {
  const a = node.attributes?.find((x) => x.name === name);
  if (!a) return undefined;
  if (typeof a.value === "string") return a.value;
  // {540} style numeric expressions
  if (a.value && typeof a.value === "object") return a.value.value;
  return undefined;
};

function inline(nodes = []) {
  return nodes.flatMap((n) => {
    switch (n.type) {
      case "text":
        return [{ t: "text", v: n.value.replace(/\s+/g, " ") }];
      case "strong":
        return [{ t: "strong", c: inline(n.children) }];
      case "emphasis":
        return [{ t: "em", c: inline(n.children) }];
      case "inlineCode":
        return [{ t: "code", v: n.value }];
      case "link":
        return [{ t: "link", href: n.url, c: inline(n.children) }];
      case "break":
        return [{ t: "text", v: " " }];
      case "mdxJsxTextElement":
        if (n.name === "Todo") return [{ t: "todo", c: inline(n.children) }];
        return inline(n.children);
      default:
        return []; // comments and expressions
    }
  });
}

function blocks(nodes = []) {
  return nodes.flatMap((n) => {
    switch (n.type) {
      case "heading":
        return [{ type: "heading", depth: n.depth, inline: inline(n.children) }];
      case "paragraph": {
        const content = inline(n.children);
        return content.length ? [{ type: "paragraph", inline: content }] : [];
      }
      case "list":
        return [{ type: "list", ordered: !!n.ordered, items: n.children.map((li) => blocks(li.children)) }];
      case "mdxJsxFlowElement":
        if (n.name === "Screenshot") {
          const shot = { type: "screenshot", alt: attr(n, "alt") ?? "" };
          for (const key of ["src", "caption"]) if (attr(n, key)) shot[key] = attr(n, key);
          for (const key of ["width", "height"]) if (attr(n, key)) shot[key] = Number(attr(n, key));
          if (!shot.alt) throw new Error("Screenshot without alt text");
          return [shot];
        }
        if (n.name === "IfItDidntWork") return [{ type: "didntWork", children: blocks(n.children) }];
        if (n.name === "Note") return [{ type: "note", children: blocks(n.children) }];
        if (n.name === "Todo") return [{ type: "paragraph", inline: [{ t: "todo", c: inline(n.children) }] }];
        return blocks(n.children);
      default:
        return []; // {/* comments */}, imports, exports
    }
  });
}

const out = {};
for (const file of readdirSync(SRC).filter((f) => f.endsWith(".mdx")).sort()) {
  const tree = parser.parse(readFileSync(join(SRC, file), "utf8"));
  out[file.replace(/\.mdx$/, "")] = blocks(tree.children);
}
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(out, null, 1) + "\n");
console.log(`guides: wrote ${Object.keys(out).length} guides to src/generated/guides.json`);
