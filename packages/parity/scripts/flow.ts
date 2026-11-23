/**
 * How long the warm-up waits for the parity screen. The warm-up is the first app launch and the first
 * deep link on a simulator created minutes earlier, and on CI that alone can take well over the real
 * runs' 15 s (once, a 40 s `simctl openurl`). The repacked app is not the cause: it keeps Hermes
 * bytecode, and it cold-starts as fast as the cached build (about 2 s to its first metrics). The
 * full-build path only hides the cost, because `expo run:ios` launches the app before the harness.
 * The real runs keep their shorter wait.
 */
export const WARM_UP_TIMEOUT_MS = 60_000;

const RUN_WAIT = /^(\s*timeout:) 15000$/m;

/** One run's commands from maestro/case.yaml, as the warm-up: the long wait and no screenshot. */
export function warmUpCommands(commands: string): string {
  if (!RUN_WAIT.test(commands)) {
    throw new Error("maestro/case.yaml: expected the ready wait to be `timeout: 15000`");
  }
  return commands
    .replace(RUN_WAIT, `$1 ${WARM_UP_TIMEOUT_MS}`)
    .replace(/^- takeScreenshot:.*$/m, "");
}
