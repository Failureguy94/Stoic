import type { MDXComponents } from "mdx/types";
import { IfItDidntWork, Note, Screenshot, Todo } from "@/components/GuideParts";

const components: MDXComponents = { Screenshot, IfItDidntWork, Note, Todo };

export function useMDXComponents(): MDXComponents {
  return components;
}
