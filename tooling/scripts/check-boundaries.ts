// Fails when a package imports something its platform must not depend on.
// Rules: docs/plans/phase-0.md (Global constraints), todo step 5, docs/architecture.md.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const packagesDir = join(root, "packages");

const isNative = (s: string) => s === "react-native" || s.startsWith("react-native-");
const isDom = (s: string) => s === "react-dom" || s.startsWith("react-dom/");
const isPkg = (name: string) => (s: string) => s === name || s.startsWith(`${name}/`);

type Rule = { test: (spec: string) => boolean; label: string };
const NO_DOM: Rule = { test: isDom, label: "react-dom" };
const NO_NATIVE: Rule = { test: isNative, label: "react-native" };
// The renderers pull react-dom / react-native in transitively, so they count as platform imports.
const NO_WEB_RENDERER: Rule = { test: isPkg("@unison-ui/react"), label: "web renderer" };
const NO_NATIVE_RENDERER: Rule = { test: isPkg("@unison-ui/native"), label: "native renderer" };
const NO_UI: Rule = { test: isPkg("@unison-ui/ui"), label: "platform-picking entry" };

function rulesFor(relPath: string): Rule[] {
  const p = relPath.split(sep).join("/");
  if (/^packages\/(tokens|core)\//.test(p) || p.startsWith("packages/motion/src/shared/")) {
    return [NO_DOM, NO_NATIVE, NO_WEB_RENDERER, NO_NATIVE_RENDERER, NO_UI];
  }
  if (p.startsWith("packages/motion/src/web/") || p.startsWith("packages/react/")) {
    return [NO_NATIVE, NO_NATIVE_RENDERER, NO_UI];
  }
  if (p.startsWith("packages/motion/src/native/") || p.startsWith("packages/native/")) {
    return [NO_DOM, NO_WEB_RENDERER, NO_UI];
  }
  return [];
}

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/.test(name)) out.push(full);
  }
  return out;
}

/**
 * Replaces comments with spaces (newlines kept, so line numbers stay right) and leaves string
 * and template literals untouched, so a mention in a comment isn't an import and a "//" inside
 * a string isn't a comment.
 */
function stripComments(text: string): string {
  let out = "";
  let i = 0;
  let quote: string | undefined;
  while (i < text.length) {
    const c = text[i] as string;
    const next = text[i + 1];
    if (quote) {
      out += c;
      if (c === "\\") {
        out += next ?? "";
        i += 2;
        continue;
      }
      if (c === quote) quote = undefined;
      i++;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      quote = c;
      out += c;
      i++;
      continue;
    }
    if (c === "/" && next === "/") {
      while (i < text.length && text[i] !== "\n") {
        out += " ";
        i++;
      }
      continue;
    }
    if (c === "/" && next === "*") {
      const end = text.indexOf("*/", i + 2);
      const stop = end === -1 ? text.length : end + 2;
      out += text.slice(i, stop).replace(/[^\n]/g, " ");
      i = stop;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

const SPECIFIER_RES = [
  // import … from "x" / export … from "x" (with or without spaces around `from`)
  /\b(?:import|export)\b[^;'"`]*?\bfrom\s*(["'])([^"'\n]+)\1/g,
  // import "x" (side effect)
  /\bimport\s*(["'])([^"'\n]+)\1/g,
  // import("x") / import(`x`) / require("x") / require(`x`)
  /\b(?:import|require)\s*\(\s*(["'`])([^"'`$\n]+)\1\s*\)/g,
];

function importSpecifiers(text: string): Array<{ spec: string; line: number }> {
  const code = stripComments(text);
  const found = new Map<number, { spec: string; line: number }>();
  for (const re of SPECIFIER_RES) {
    for (const m of code.matchAll(re)) {
      const spec = m[2] as string;
      const index = (m.index ?? 0) + m[0].lastIndexOf(spec);
      found.set(index, { spec, line: code.slice(0, index).split("\n").length });
    }
  }
  return [...found.values()].sort((a, b) => a.line - b.line);
}

function check(): string[] {
  const failures: string[] = [];
  const packages = existsSync(packagesDir) ? readdirSync(packagesDir) : [];
  for (const pkg of packages) {
    const pkgRoot = join(packagesDir, pkg);
    for (const file of walk(join(pkgRoot, "src"))) {
      const rel = relative(root, file);
      for (const { spec, line } of importSpecifiers(readFileSync(file, "utf8"))) {
        for (const rule of rulesFor(rel)) {
          if (rule.test(spec)) {
            failures.push(`${rel}:${line}  forbidden import "${spec}" (${rule.label})`);
          }
        }
        if (spec.startsWith(".")) {
          const target = resolve(dirname(file), spec);
          if (!target.startsWith(pkgRoot + sep)) {
            failures.push(`${rel}:${line}  relative import "${spec}" leaves packages/${pkg}`);
          }
        }
      }
    }
  }
  return failures;
}

const failures = check();
if (failures.length > 0) {
  console.error(failures.join("\n"));
  console.error(`\n${failures.length} import-boundary violation(s).`);
  process.exit(1);
}
console.log("import boundaries ok");
