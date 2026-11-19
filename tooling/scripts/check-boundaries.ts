// Fails when a package imports something its platform must not depend on.
// Rules: docs/plans/phase-0.md (Global constraints) and todo step 5.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const packagesDir = join(root, "packages");

const isNative = (s: string) => s === "react-native" || s.startsWith("react-native-");
const isDom = (s: string) => s === "react-dom" || s.startsWith("react-dom/");

type Rule = { test: (spec: string) => boolean; label: string };
const NO_DOM: Rule = { test: isDom, label: "react-dom" };
const NO_NATIVE: Rule = { test: isNative, label: "react-native" };

function rulesFor(relPath: string): Rule[] {
  const p = relPath.split(sep).join("/");
  if (/^packages\/(tokens|core)\//.test(p) || p.startsWith("packages/motion/src/shared/")) {
    return [NO_DOM, NO_NATIVE];
  }
  if (p.startsWith("packages/motion/src/web/") || p.startsWith("packages/react/")) {
    return [NO_NATIVE];
  }
  if (p.startsWith("packages/motion/src/native/") || p.startsWith("packages/native/")) {
    return [NO_DOM];
  }
  return [];
}

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
}

// import … from "x" | export … from "x" | import "x" | import("x")
const IMPORT_RE =
  /(?:import|export)\s+(?:type\s+)?[^'"]*?\sfrom\s*["']([^"']+)["']|import\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;

const failures: string[] = [];
const packages = existsSync(packagesDir) ? readdirSync(packagesDir) : [];

for (const pkg of packages) {
  const pkgRoot = join(packagesDir, pkg);
  for (const file of walk(join(pkgRoot, "src"))) {
    const rel = relative(root, file);
    const text = readFileSync(file, "utf8");
    for (const m of text.matchAll(IMPORT_RE)) {
      const spec = m[1] ?? m[2] ?? m[3];
      if (!spec) continue;
      const line = text.slice(0, m.index).split("\n").length;
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

if (failures.length > 0) {
  console.error(failures.join("\n"));
  console.error(`\n${failures.length} import-boundary violation(s).`);
  process.exit(1);
}
console.log("import boundaries ok");
