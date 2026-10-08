#!/usr/bin/env node
// Self-test for OKF-TOGAF#169 (spun off from #158): davidfacer.com's own
// public/llms.txt tells AI readers what aimaturitymodels.com publishes, and
// must say it truly. Since #158, aimaturitymodels.com/llms.txt is a map and
// the full model text is /llms-full.txt; since #167 the fourth model is
// Portfolio Prioritization; and Strata is "the architectural governance
// plane", the owner's words. On "Open a Work Item spun off from #158 for
// davidfacer.com's llms.txt, and fix it as 159-CC drafts -- David Facer
// 10/8/2026" (OKF TOGAF briefs/2026-10-01-svm-tranche-3/159-CC).
// Offline; exit 1 on a failing case.
"use strict";

const fs = require("fs");
const path = require("path");

let bad = 0;
const say = (ok, name, shown) => {
  console.log("  " + (ok ? "PASS" : "FAIL") + "  " + name.padEnd(60) + (shown || ""));
  if (!ok) bad = 1;
};
const text = fs.readFileSync(path.join(__dirname, "..", "public", "llms.txt"), "utf8").replace(/\r\n/g, "\n");
const at = text.indexOf("\nhttps://aimaturitymodels.com\n");
const end = text.indexOf("\nhttps://maturitymodel.substack.com/", at);
const passage = at >= 0 && end > at ? text.slice(at, end) : "";

say(!!passage, "the aimaturitymodels.com passage is found");
say(/https:\/\/aimaturitymodels\.com\/llms-full\.txt\s+the full text/.test(passage), "it names /llms-full.txt as the full text");
say(/https:\/\/aimaturitymodels\.com\/llms\.txt\s+the map/.test(passage), "it names /llms.txt as the map");
say(/fetch the\s+full text, not this file/.test(passage), "it sends a reader wanting the models to the full text");
say(!/CARRIES the model\s+content in full rather than pointing at it:\s+https:\/\/aimaturitymodels\.com\/llms\.txt/.test(passage), "it no longer says /llms.txt carries the models in full");
say(/Portfolio Prioritization/.test(passage) && !/Product Prioritization/.test(passage), "the model's current name");
say(/Strata, the architectural\s+governance plane/.test(passage) && !/layered governance model/.test(passage), "Strata in the owner's words");

console.log(bad ? "LLMS SELF-TEST FAIL" : "LLMS SELF-TEST PASS");
process.exit(bad);
