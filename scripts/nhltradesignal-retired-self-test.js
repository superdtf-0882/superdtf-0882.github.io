#!/usr/bin/env node
// Self-test for OKF-TOGAF#187, NHL Trade Signal's retirement, step 2 (OKF TOGAF
// briefs/2026-10-01-svm-tranche-3/1027-CC and 1029-CC), on "Approve NHL Trade Signal's
// retirement plan as CC's 1027 brief gives it, its five open endpoints down first, its data
// deleted from the shared store by its prefix with the archive's copies left to expire, its
// repository archived, a short retired page at its address, which serves my intent to
// demonstrate at enterprise non-functional standard -- David Facer 11/15/2026".
//
// The dashboard is retired on prototypes.davidfacer.com (step 1). Here the prototypes page stops
// offering its card and llms.txt stops listing it; Dinosaur Comics Therapy stays on both.
// Offline; exit 1 on a failing case.
"use strict";

const fs = require("fs");
const path = require("path");

let bad = 0;
const say = (ok, name, shown) => {
  console.log("  " + (ok ? "PASS" : "FAIL") + "  " + name.padEnd(64) + (shown || ""));
  if (!ok) bad = 1;
};
const read = (rel) => { try { return fs.readFileSync(path.join(__dirname, "..", rel), "utf8").replace(/\r\n/g, "\n"); } catch (e) { return ""; } };

const protos = read("public/sampleprototypes/index.html");
say(!!protos, "the prototypes page is read");
say(!/nhltradesignal/i.test(protos) && !/NHL Trade Signal/i.test(protos), "the prototypes page no longer offers NHL Trade Signal");
say(/href="https:\/\/prototypes\.davidfacer\.com\/dinotherapy"/.test(protos), "Dinosaur Comics Therapy stays on it");
say((protos.match(/<a href=/g) || []).length === (protos.match(/<\/a>/g) || []).length, "its links still open and close in pairs");

const llms = read("public/llms.txt");
say(!!llms, "llms.txt is read");
say(!/nhltradesignal|NHL Trade Signal/i.test(llms), "llms.txt no longer lists NHL Trade Signal");
say(/https:\/\/prototypes\.davidfacer\.com\/dinotherapy/.test(llms), "Dinosaur Comics Therapy stays in llms.txt");
say(!/the others\s+are\s+on\s+a\s+separate\s+subdomain/.test(llms), "llms.txt no longer speaks of several on the subdomain");

const sitemap = read("public/sitemap.xml");
say(!!sitemap && !/nhltradesignal/i.test(sitemap), "the sitemap does not list it");

console.log(bad ? "\nSELF-TEST FAILED." : "\nSelf-test passed.");
process.exitCode = bad;
