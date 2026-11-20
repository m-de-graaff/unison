// `pnpm release`, run by .github/workflows/release.yml through changesets/action.
//
// changesets/action calls this whenever no changesets are pending, and `changeset publish`
// publishes every version npm doesn't have yet. Before the first "Version packages" PR is
// merged the public packages are still at 0.0.0, so that would publish a 0.0.0 release.
// Skip until the fixed version group has been versioned once.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const { version } = JSON.parse(readFileSync("packages/ui/package.json", "utf8")) as {
  version: string;
};

if (version === "0.0.0") {
  console.log(
    "release: packages are still at 0.0.0 (no Version packages PR merged yet); nothing to publish",
  );
  process.exit(0);
}

for (const args of [["build"], ["changeset", "publish"]]) {
  const result = spawnSync("pnpm", args, { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
