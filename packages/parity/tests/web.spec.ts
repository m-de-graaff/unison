import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { runs } from "../src/fixtures";
import { type Metrics, metricsPath, type Platform, screenshotPath } from "../src/types";

for (const r of runs()) {
  test(r.id, async ({ page }, info) => {
    const platform = info.project.name as Platform;
    await page.goto(`/parity/${r.component}/${r.caseName}?theme=${r.theme}&scheme=${r.scheme}`);
    await page.locator("html[data-parity-ready]").waitFor({ state: "attached" });

    const stage = page.getByTestId("stage");
    const shot = screenshotPath(platform, r.id);
    mkdirSync(dirname(shot), { recursive: true });
    await stage.screenshot({ path: shot, animations: "disabled" });

    const s = await stage.boundingBox();
    const sub = await page.getByTestId("subject").boundingBox();
    if (!s || !sub) throw new Error("stage or subject not found");
    const rel = (b: { x: number; y: number; width: number; height: number }) => ({
      x: b.x - s.x,
      y: b.y - s.y,
      width: b.width,
      height: b.height,
    });
    const parts: Metrics["parts"] = { subject: rel(sub) };
    const samples: NonNullable<Metrics["samples"]> = {};
    for (const el of await page.locator("[data-part]").all()) {
      const name = (await el.getAttribute("data-part")) as string;
      const box = await el.boundingBox();
      if (!box) continue;
      parts[name] = rel(box);
      if ((await el.getAttribute("data-sample")) !== null) {
        samples[name] = { x: box.x - s.x + box.width / 2, y: box.y - s.y + box.height / 2 };
      }
    }
    const metrics: Metrics = {
      platform,
      run: r.id,
      pixelRatio: 2,
      stage: s,
      parts,
      ...(Object.keys(samples).length > 0 ? { samples } : {}),
    };
    const file = metricsPath(platform, r.id);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, `${JSON.stringify(metrics, null, 2)}\n`);

    const axe = await new AxeBuilder({ page }).include('[data-testid="stage"]').analyze();
    expect(axe.violations).toEqual([]);
  });
}
