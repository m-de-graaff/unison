// HTTP server the native apps POST their layout metrics to (port 4545).
import { mkdirSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { type Metrics, metricsPath, PLATFORMS } from "../src/types";

const RUN_RE = /^[a-z0-9-]+\/[a-z0-9-]+\/(light|dark)$/;

function isMetrics(value: unknown): value is Metrics {
  if (typeof value !== "object" || value === null) return false;
  const m = value as Partial<Metrics>;
  return (
    typeof m.platform === "string" &&
    (PLATFORMS as readonly string[]).includes(m.platform) &&
    typeof m.run === "string" &&
    RUN_RE.test(m.run) &&
    typeof m.pixelRatio === "number" &&
    typeof m.stage === "object" &&
    typeof m.parts?.subject === "object"
  );
}

/** Starts the collector; resolves to a function that stops it. */
export function startCollector(port = 4545): Promise<() => Promise<void>> {
  const cors = {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type",
  };
  const server = createServer((req, res) => {
    if (req.method === "OPTIONS") {
      res.writeHead(204, cors).end();
      return;
    }
    if (req.method !== "POST" || req.url !== "/metrics") {
      res.writeHead(404, cors).end();
      return;
    }
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(body);
      } catch {
        res.writeHead(400, cors).end("invalid json");
        return;
      }
      if (!isMetrics(parsed)) {
        console.error(`collector: rejected ${body.slice(0, 200)}`);
        res.writeHead(400, cors).end("invalid metrics");
        return;
      }
      const file = metricsPath(parsed.platform, parsed.run);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, `${JSON.stringify(parsed, null, 2)}\n`);
      console.log(`collector: ${parsed.platform} ${parsed.run}`);
      res.writeHead(204, cors).end();
    });
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, () => {
      resolve(() => new Promise<void>((done) => server.close(() => done())));
    });
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await startCollector();
  console.log("collector listening on :4545");
}
