// Writes parity-output/report.html: one row per run, one column per platform.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { runs } from "../src/fixtures";
import { type Metrics, metricsPath, OUT, PLATFORMS, screenshotPath } from "../src/types";

const escapeHtml = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

function readMetrics(platform: (typeof PLATFORMS)[number], run: string): Metrics | undefined {
  const file = metricsPath(platform, run);
  return existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as Metrics) : undefined;
}

/** Writes the report and returns its path. */
export function writeReport(failures: string[]): string {
  const rows = runs().map((r) => {
    const runFailures = failures.filter(
      (f) => f.startsWith(`FAIL ${r.id}:`) || f.startsWith(`FAIL ${r.id} [`),
    );
    const cells = PLATFORMS.map((p) => {
      const shot = screenshotPath(p, r.id);
      return existsSync(shot)
        ? `<td><img src="${shot.slice(OUT.length + 1)}" alt="${p} ${r.id}"></td>`
        : '<td class="missing">—</td>';
    }).join("");
    const metrics = PLATFORMS.map((p) => {
      const s = readMetrics(p, r.id)?.parts.subject;
      return `<td>${s ? `x ${s.x} · y ${s.y} · ${s.width}×${s.height}` : "—"}</td>`;
    }).join("");
    const notes = runFailures.length
      ? `<tr class="fail"><td></td><td colspan="4">${runFailures.map(escapeHtml).join("<br>")}</td></tr>`
      : "";
    return `<tr class="${runFailures.length ? "fail" : ""}"><th>${r.id}</th>${cells}</tr>
<tr class="metrics"><td></td>${metrics}</tr>${notes}`;
  });
  const html = `<!doctype html>
<meta charset="utf-8">
<title>Parity report</title>
<style>
  body { font: 14px system-ui, sans-serif; margin: 24px; color: #111; }
  table { border-collapse: collapse; }
  th, td { padding: 6px 10px; text-align: left; vertical-align: top; }
  thead th { border-bottom: 1px solid #ccc; }
  tr.fail th, tr.fail td { outline: 2px solid #e5484d; color: #b4232a; }
  tr.metrics td { font: 12px ui-monospace, monospace; color: #555; padding-bottom: 16px; }
  img { max-width: 220px; border: 1px solid #ddd; }
  .missing { color: #999; }
</style>
<h1>Parity report</h1>
<p>${failures.length ? `${failures.length} failure(s)` : "All runs match."}</p>
<table>
<thead><tr><th>Run</th>${PLATFORMS.map((p) => `<th>${p}</th>`).join("")}</tr></thead>
<tbody>
${rows.join("\n")}
</tbody>
</table>
`;
  mkdirSync(OUT, { recursive: true });
  const file = join(OUT, "report.html");
  writeFileSync(file, html);
  return file;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(`wrote ${writeReport([])}`);
}
