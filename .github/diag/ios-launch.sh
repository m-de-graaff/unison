#!/usr/bin/env bash
# TEMPORARY diagnostic (not for merge): why does the repacked iOS app cold-start slowly?
# Usage: ios-launch.sh <source .app> <repacked .app>
set -uo pipefail
SRC=$1 OUT=$2
UDID=$PARITY_IOS_UDID
APP_ID=dev.unison.demo
DIAG=$RUNNER_TEMP/diag
mkdir -p "$DIAG"

section() { echo; echo "=== $* ($(date -u +%H:%M:%S))"; }

section "bundle format and code signature"
RESIGNED=$DIAG/resigned/$(basename "$OUT")
mkdir -p "$(dirname "$RESIGNED")"
cp -R "$OUT" "$RESIGNED"
codesign --force --sign - --timestamp=none --preserve-metadata=identifier,entitlements,flags "$RESIGNED"
for app in "$SRC" "$OUT" "$RESIGNED"; do
  echo "--- $app"
  ls -l "$app/main.jsbundle"
  file "$app/main.jsbundle"
  xxd -l 16 "$app/main.jsbundle"
  shasum -a 256 "$app/main.jsbundle"
  codesign --verify --deep --strict -vvv "$app" 2>&1 | tail -5
  codesign -dvvv "$app" 2>&1 | grep -E "^(Identifier|Format|CodeDirectory|Signature|Sealed Resources|Info.plist)" 
done

# A collector that accepts the metrics POST, so the parity screen shows its ready marker.
node -e '
require("http").createServer((q, s) => {
  q.resume();
  q.on("end", () => { console.log(`collector ${new Date().toISOString()} ${q.method} ${q.url}`); s.writeHead(204, {"access-control-allow-origin": "*", "access-control-allow-headers": "content-type"}).end(); });
}).listen(4545);
' > "$DIAG/collector.log" 2>&1 &
COLLECTOR_PID=$!

FLOW=$DIAG/launch.yaml
cat > "$FLOW" <<'YAML'
appId: dev.unison.demo
---
- openLink: unison-demo://parity/elevation/all?theme=brand&scheme=dark
- runFlow:
    when:
      platform: iOS
    commands:
      - tapOn:
          text: "Open"
          optional: true
- extendedWaitUntil:
    visible:
      id: "parity-ready"
    timeout: 120000
YAML

BOOTED=$(date +%s)
# One measured launch: [reinstall] then a deep link, as the harness's warm-up does.
measure() {
  local label=$1 app=$2 reinstall=$3
  section "$label (simulator up $(( $(date +%s) - BOOTED ))s since this script started)"
  xcrun simctl terminate "$UDID" "$APP_ID" 2>/dev/null
  if [ "$reinstall" = yes ]; then
    xcrun simctl uninstall "$UDID" "$APP_ID"
    local t0=$(date +%s)
    xcrun simctl install "$UDID" "$app"
    echo "install: $(( $(date +%s) - t0 ))s"
  fi
  local dbg=$DIAG/maestro-$label
  rm -rf "$dbg"
  local t1=$(date +%s)
  echo "  $(date -u +%H:%M:%S) maestro start"
  maestro test --debug-output "$dbg" "$FLOW" 2>&1 | while IFS= read -r line; do echo "  $(date -u +%H:%M:%S) $line"; done | tee "$dbg.log" | grep -E "Open|Assert|Tap|Running on"
  echo "maestro exit ${PIPESTATUS[0]} after $(( $(date +%s) - t1 ))s (includes driver start)"
  node -e '
    const fs = require("fs"), path = require("path");
    const dir = process.argv[1];
    const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
    const f = fs.existsSync(dir) && walk(dir).find((n) => /commands-.*\.json$/.test(path.basename(n)));
    if (!f) { console.log("  no commands json; maestro log tail:"); process.exit(0); }
    for (const c of JSON.parse(fs.readFileSync(f, "utf8"))) {
      const name = Object.keys(c.command).find((k) => c.command[k]);
      const m = c.metadata ?? {};
      console.log(`  ${name.padEnd(28)} ${m.status} ${((m.duration ?? 0) / 1000).toFixed(1)}s at ${new Date(m.timestamp).toISOString()}`);
    }
  ' "$dbg"
  tail -3 "$DIAG/collector.log"
}

echo "simulator kern.boottime: $(xcrun simctl spawn "$UDID" sysctl -n kern.boottime 2>/dev/null)"
measure source-1st-launch "$SRC" yes
measure source-2nd-launch "$SRC" no
measure repacked-1st-launch "$OUT" yes
measure repacked-2nd-launch "$OUT" no
measure resigned-1st-launch "$RESIGNED" yes

kill $COLLECTOR_PID
# Leave the simulator as the harness expects: the repacked app freshly installed, never launched.
xcrun simctl terminate "$UDID" "$APP_ID" 2>/dev/null
xcrun simctl uninstall "$UDID" "$APP_ID"
xcrun simctl install "$UDID" "$OUT"
exit 0
