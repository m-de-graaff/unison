/**
 * How long the warm-up waits for the parity screen. The warm-up is the app's cold launch: on a CI
 * simulator, a freshly installed (or repacked) app can take well over the real runs' 15 s before its
 * first screen is ready. The real runs keep their shorter wait.
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
