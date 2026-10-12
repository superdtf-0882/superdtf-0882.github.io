#!/usr/bin/env node
// Self-test for OKF-TOGAF#186, the Black Sea Monitor's retirement (OKF TOGAF
// briefs/2026-10-01-svm-tranche-3/153-DT2 and 156-DT2), on "Black Sea Phase 2
// as 156-DT2 records it: delete the Vercel project black-sea-real-estate once
// nothing links to it, archive BlackSeaRealEstate, OI-038 folded into #186 --
// David Facer 10/12/2026". davidfacer.com/blackseamonitor/ becomes a short
// retired page that loads nothing from the monitor's back end, and the home
// page, the sitemap and llms.txt stop listing it. The rewrite in
// next.config.js stays: it is what serves the retired page at its address.
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

const page = read("public/blackseamonitor/index.html");
say(!!page, "the retired page exists at /blackseamonitor/");
say(/has been retired/i.test(page) && /It ran from July to October 2026/.test(page), "it says the monitor is retired and when it ran");
say(!/black-sea-real-estate|\/api\//.test(page), "it loads nothing from the monitor's back end");
say(!/<script\b/i.test(page), "it runs no script");
say(page.length > 0 && page.length < 8000, "it is short", page.length + " bytes");
say(/<meta name="robots" content="noindex">/.test(page), "it asks search engines not to index it");

const home = read("public/index.html");
say(!!home && !/href="\/blackseamonitor\/"/.test(home) && !/Black Sea Monitor/.test(home), "the home page no longer lists it");
const sitemap = read("public/sitemap.xml");
say(!!sitemap && !/blackseamonitor/.test(sitemap), "the sitemap no longer lists it");
const llms = read("public/llms.txt");
say(!!llms && !/blackseamonitor|Black Sea Monitor/i.test(llms), "llms.txt no longer lists it");
const cfg = read("next.config.js");
say(/'\/blackseamonitor\/'/.test(cfg), "the rewrite that serves the retired page stays");

console.log(bad ? "\nSELF-TEST FAILED." : "\nSelf-test passed.");
process.exitCode = bad;
