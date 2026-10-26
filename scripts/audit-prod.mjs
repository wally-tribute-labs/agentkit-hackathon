#!/usr/bin/env node
/**
 * Production dependency audit: fails on any high/critical advisory except the
 * ones listed in ALLOWED, each with the reason it can't be fixed yet.
 *
 * `npm audit` has no ignore flag, so this reads its JSON report and checks the
 * advisory objects themselves (not the per-package roll-up, which marks every
 * package that depends on a vulnerable one).
 */
import { execFileSync } from "node:child_process";

const ALLOWED = {
  // zod 3 memory exhaustion on oversized arrays. Fixed only in zod 4.6.6; zod 3
  // gets no fix. Reached through dependencies that still require zod 3.
  // Remove once `npm ls zod --omit=dev` shows no 3.x copies.
  "GHSA-mrhx-c7xc-m3w5": "zod 3 has no fixed release",
};
const FAIL_ON = new Set(["high", "critical"]);

let raw;
try {
  raw = execFileSync("npm", ["audit", "--omit=dev", "--json"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
} catch (err) {
  // npm audit exits 1 when it finds anything; the JSON is still on stdout.
  raw = err.stdout;
}
const report = JSON.parse(raw);
if (report.error) {
  console.error(`npm audit failed: ${report.error.summary ?? JSON.stringify(report.error)}`);
  process.exit(2);
}

const found = new Map();
for (const [pkg, v] of Object.entries(report.vulnerabilities ?? {})) {
  for (const via of v.via) {
    if (typeof via !== "object" || !FAIL_ON.has(via.severity)) continue;
    const id = via.url?.split("/").pop() ?? String(via.source);
    if (!found.has(id)) found.set(id, { severity: via.severity, title: via.title, packages: new Set() });
    found.get(id).packages.add(`${pkg}@${via.range}`);
  }
}

const blocking = [...found].filter(([id]) => !(id in ALLOWED));
for (const [id] of found) if (id in ALLOWED) console.log(`allowed ${id}: ${ALLOWED[id]}`);
for (const [id, a] of blocking) console.error(`${a.severity} ${id} ${a.title} — ${[...a.packages].join(", ")}`);
if (blocking.length) {
  console.error(`${blocking.length} high/critical production advisories (allowlist: ${Object.keys(ALLOWED).join(", ")})`);
  process.exit(1);
}
console.log(`0 blocking high/critical production advisories (${found.size} found, all allowlisted)`);
