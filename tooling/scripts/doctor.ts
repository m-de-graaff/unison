// `pnpm run doctor`: checks the local toolchain and prints ✓ or ✗ with the fix for each item.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createServer } from "node:net";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const isMac = process.platform === "darwin";

interface Check {
  name: string;
  run: () => boolean | Promise<boolean>;
  fix: string;
  /** Skip the check when this returns false (e.g. macOS-only checks on Linux). */
  when?: () => boolean;
}

function output(cmd: string): string | undefined {
  try {
    return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString();
  } catch {
    return undefined;
  }
}

const works = (cmd: string) => output(cmd) !== undefined;

const devices = JSON.parse(
  readFileSync(join(root, "packages/parity/parity-devices.json"), "utf8"),
) as { ios: { name: string; deviceType: string }; android: { avd: string; systemImage: string } };

const nvmrc = readFileSync(join(root, ".nvmrc"), "utf8").trim();
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
  packageManager: string;
};
const pinnedPnpm = pkg.packageManager.replace(/^pnpm@/, "").split("+")[0];

function portFree(port: number): Promise<boolean> {
  return new Promise((done) => {
    const server = createServer();
    server.once("error", () => done(false));
    server.listen(port, () => server.close(() => done(true)));
  });
}

const checks: Check[] = [
  {
    name: `Node ${nvmrc} (from .nvmrc)`,
    run: () => process.versions.node.split(".")[0] === nvmrc,
    fix: `nvm install ${nvmrc} && nvm use (you have ${process.versions.node})`,
  },
  {
    name: `pnpm ${pinnedPnpm} (from packageManager)`,
    run: () => output("pnpm -v")?.trim() === pinnedPnpm,
    fix: "npm i -g corepack && corepack enable && corepack install",
  },
  {
    name: "Xcode",
    when: () => isMac,
    run: () => works("xcodebuild -version"),
    fix: "Install Xcode from the App Store, then: sudo xcode-select -s /Applications/Xcode.app",
  },
  {
    name: `Parity simulator "${devices.ios.name}"`,
    when: () => isMac,
    run: () => output("xcrun simctl list devices")?.includes(devices.ios.name) ?? false,
    fix: `xcrun simctl create "${devices.ios.name}" ${devices.ios.deviceType}`,
  },
  {
    name: "watchman",
    when: () => isMac,
    run: () => works("watchman -v"),
    fix: "brew install watchman",
  },
  {
    name: "ANDROID_HOME is set",
    run: () => Boolean(process.env.ANDROID_HOME),
    fix: "export ANDROID_HOME=<Android SDK path> (Android Studio → Settings → Android SDK)",
  },
  {
    name: "adb",
    run: () => works("adb version"),
    fix: 'export PATH="$ANDROID_HOME/platform-tools:$PATH"',
  },
  {
    name: `Parity emulator "${devices.android.avd}"`,
    run: () => output("emulator -list-avds")?.split("\n").includes(devices.android.avd) ?? false,
    fix: `sdkmanager "${devices.android.systemImage}" && avdmanager create avd -n ${devices.android.avd} -d pixel_7 -k "${devices.android.systemImage}"`,
  },
  {
    name: "Maestro",
    run: () => works("maestro --version"),
    fix: 'curl -fsSL "https://get.maestro.mobile.dev" | bash',
  },
  ...[3000, 5173, 8081, 4545].map(
    (port): Check => ({
      name: `Port ${port} is free`,
      run: () => portFree(port),
      fix: `lsof -i :${port} (then stop that process)`,
    }),
  ),
];

let failed = 0;
for (const check of checks) {
  if (check.when && !check.when()) continue;
  if (await check.run()) {
    console.log(`✓ ${check.name}`);
  } else {
    failed++;
    console.log(`✗ ${check.name}\n    fix: ${check.fix}`);
  }
}
if (!isMac) console.log("(macOS-only checks skipped: Xcode, iOS simulator, watchman)");
process.exit(failed > 0 ? 1 : 0);
