import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { runs } from "../src/fixtures";
import { type Metrics, metricsPath, type Platform, screenshotPath } from "../src/types";

for (const r of runs()) {
  test(r.id, async ({ page }, info) => {
    const platform = info.project.name as Platform;
    await page.goto(`/parity/${r.component}/${r.caseName}?scheme=${r.scheme}`);
    await page.locator("html[data-parity-ready]").waitFor({ state: "attached" });

    const stage = page.getByTestId("stage");
    const shot = screenshotPath(platform, r.id);
    mkdirSync(dirname(shot), { recursive: true });
    await stage.screenshot({ path: shot, animations: "disabled" });

    const s = await stage.boundingBox();
    const sub = await page.getByTestId("subject").boundingBox();
    if (!s || !sub) throw new Error("stage or subject not found");
    const metrics: Metrics = {
      platform,
      run: r.id,
      pixelRatio: 2,
      stage: s,
      parts: { subject: { x: sub.x - s.x, y: sub.y - s.y, width: sub.width, height: sub.height } },
    };
    const file = metricsPath(platform, r.id);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, `${JSON.stringify(metrics, null, 2)}\n`);

    const axe = await new AxeBuilder({ page }).include('[data-testid="stage"]').analyze();
    expect(axe.violations).toEqual([]);
  });
}
