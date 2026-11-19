#!/usr/bin/env node
import { compile } from "./index";

const [command] = process.argv.slice(2);

if (command !== "build") {
  console.error("Usage: unison-tokens build");
  process.exit(1);
}

try {
  const files = await compile({ cwd: process.cwd() });
  for (const file of files) console.log(`wrote ${file}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
