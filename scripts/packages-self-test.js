#!/usr/bin/env node
// Self-test for davidfacer.com's packages -- OKF-TOGAF#244, on the owner's plan line "Approve the
// davidfacer.com packages plan as CC's 1053 brief gives it, Next.js to 15.5.29 within its series, the
// postcss override remembered by its test, ... -- David Facer 11/16/2026" (1053-CC of OKF TOGAF
// briefs/2026-10-01-svm-tranche-3/, read by DT2 in 553-DT2), on item 245's pattern.
//
// Offline, from package.json and package-lock.json, it checks that every package npm's audit
// flagged high or critical on 2026-11-16 sits at or past the version that closes its advisories:
// Next.js on its 15.5 series at 15.5.28 or later and pinned exactly, its lint config moved with it,
// nanoid, sharp, source-map-js and every copy of postcss past their fixes, and React kept at 19.
//
// THE OVERRIDE IS A STOPGAP, AND THIS TEST REMEMBERS IT. Next.js 15 pins an old postcss; package.json's
// "overrides" gives it a current one. The override must be present while Next.js is on 15 and gone
// once Next.js is on 16 or later, so a move to 16 fails here until the override is removed.
//
// It checks versions, not npm's live advisory list, so it never stops a build because an advisory
// was published overnight. Whether the build should stop on a new high or critical weakness is a
// separate decision under RULE-9, not this test's.
// Usage: node scripts/packages-self-test.js   (exit 1 on a failing case)
"use strict";
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const readJson = (p) => { try { return JSON.parse(fs.readFileSync(path.join(root, p), "utf8")); } catch { return null; } };
let bad = 0;
const ok = (c, what, shown) => { console.log("  " + (c ? "PASS" : "FAIL") + "  " + what + (shown === undefined ? "" : "   " + shown)); if (!c) bad = 1; };

const parse = (v) => (String(v || "").match(/^(\d+)\.(\d+)\.(\d+)/) || []).slice(1).map(Number);
const cmp = (a, b) => { const x = parse(a), y = parse(b); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); } return 0; };
const atLeast = (v, floor) => !!v && parse(v).length === 3 && cmp(v, floor) >= 0;

console.log("SELF-TEST -- davidfacer.com's packages (OKF-TOGAF#244; 1053-CC, 553-DT2).\n");
const pkg = readJson("package.json") || {};
const lock = readJson("package-lock.json") || {};
const packages = lock.packages || {};
ok(Object.keys(packages).length > 0, "the lock file is read");
const copies = (name) => Object.entries(packages)
  .filter(([k]) => k === "node_modules/" + name || k.endsWith("/node_modules/" + name))
  .map(([k, v]) => ({ at: k, version: v.version }));
const one = (name) => (packages["node_modules/" + name] || {}).version;

// Next.js
const next = one("next");
const major = parse(next)[0];
ok(major === 15 ? atLeast(next, "15.5.28") && parse(next)[1] === 5 : major >= 16, "Next.js is on 15.5 at 15.5.28 or later, or on 16 or later", next);
ok(/^\d+\.\d+\.\d+$/.test((pkg.dependencies || {}).next || ""), "package.json pins Next.js exactly", (pkg.dependencies || {}).next);
ok(((pkg.dependencies || {}).next || "") === next, "and the lock file installs that version");
ok(parse(one("eslint-config-next"))[0] === major && parse(one("@next/eslint-plugin-next"))[0] === major, "its lint config moved with it", one("eslint-config-next"));

// React kept
ok(parse(one("react"))[0] === 19 && parse(one("react-dom"))[0] === 19, "React is kept at 19", one("react"));

// The packages npm fixed in their own versions
const nano = copies("nanoid");
ok(nano.length > 0 && nano.every((c) => atLeast(c.version, "3.3.18") || parse(c.version)[0] > 3), "every nanoid at 3.3.18 or later", nano.map((c) => c.version).join(" "));
const sharp = copies("sharp");
ok(sharp.every((c) => atLeast(c.version, "0.35.5")), "sharp, where present, at 0.35.5 or later", sharp.map((c) => c.version).join(" ") || "absent");
const smj = copies("source-map-js");
ok(smj.every((c) => atLeast(c.version, "1.2.2")), "every source-map-js at 1.2.2 or later", smj.map((c) => c.version).join(" "));

// postcss, and the override that holds it
const pcss = copies("postcss");
ok(pcss.length > 0 && pcss.every((c) => atLeast(c.version, "8.5.23")), "every postcss at 8.5.23 or later", pcss.map((c) => c.version).join(" "));
const override = (pkg.overrides || {}).postcss;
if (major === 15) ok(!!override, "while Next.js is on 15, the postcss override is present", override);
else if (major >= 16) ok(!override, "on Next.js 16 or later, the postcss override is removed", override || "absent");

// Wired into the build
ok(/packages-self-test\.js/.test((pkg.scripts || {}).prebuild || ""), "this test runs before every build");

console.log(bad ? "\nSELF-TEST FAILED." : "\nSelf-test passed.");
process.exit(bad);
