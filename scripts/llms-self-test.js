#!/usr/bin/env node
// Self-test for OKF-TOGAF#169 (spun off from #158), moved with the rewrite under
// OKF-TOGAF#237: davidfacer.com's own public/llms.txt, now a plain Markdown
// index, tells readers what aimaturitymodels.com publishes, and must say it
// truly. Since #158, aimaturitymodels.com/llms.txt is a map and the full model
// text is /llms-full.txt; since #167 the fourth model is Portfolio
// Prioritization; and Strata is "the architectural governance plane", the
// owner's words. No line in the file is addressed to a model (#237).
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
const at = text.indexOf("\n## Published elsewhere\n");
const passage = at >= 0 ? text.slice(at) : "";

say(!!passage, "the aimaturitymodels.com passage is found");
say(/\[The full text\]\(https:\/\/aimaturitymodels\.com\/llms-full\.txt\)/.test(passage), "it names /llms-full.txt as the full text");
say(/\[The map\]\(https:\/\/aimaturitymodels\.com\/llms\.txt\)/.test(passage), "it names /llms.txt as the map");
say(/the models' full text is there, not in this file/.test(passage), "it says where the models' text is");
say(!/Product Prioritization/.test(passage), "no retired model name");
say(/Strata, the architectural\s+governance plane/.test(passage) && !/layered governance model/.test(passage), "Strata in the owner's words");

console.log(bad ? "LLMS SELF-TEST FAIL" : "LLMS SELF-TEST PASS");
process.exit(bad);
