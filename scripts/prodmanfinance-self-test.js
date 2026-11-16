#!/usr/bin/env node
// Self-test for OKF-TOGAF#243, Finance for Product Managers at davidfacer.com/prodmanfinance/
// (OKF TOGAF briefs/2026-10-01-svm-tranche-3/1040-CC and 1041-CC). The page's sums live in
// public/prodmanfinance/finance.js, which the page and this test both load. Every sum is checked
// against an answer this file works out its own way, so a wrong sum stops the build. The page
// loads nothing but Google Fonts and its own sums, stores nothing and sends nothing, and every
// input carries a label. It is listed on the prototypes page, in llms.txt and in the sitemap.
// Offline; exit 1 on a failing case. Run in prebuild.
"use strict";

const fs = require("fs");
const path = require("path");

let bad = 0;
const say = (ok, name, shown) => {
  console.log("  " + (ok ? "PASS" : "FAIL") + "  " + name.padEnd(72) + (shown === undefined ? "" : String(shown)));
  if (!ok) bad = 1;
};
const root = path.join(__dirname, "..");
const read = (rel) => { try { return fs.readFileSync(path.join(root, rel), "utf8").replace(/\r\n/g, "\n"); } catch (e) { return ""; } };
const near = (a, b, tol) => Number.isFinite(a) && Math.abs(a - b) <= tol;

// ---------------------------------------------------------------- the sums
let F = null;
try { F = require(path.join(root, "public", "prodmanfinance", "finance.js")); } catch (e) { F = null; }
say(!!F, "the sums file loads");
const call = (fn) => { try { return fn(); } catch (e) { return NaN; } };

// This file's own way of discounting: one cash amount per whole year, summed by hand.
const presentValue = (cash, ratePct) => cash.reduce((s, c, t) => s + c / Math.pow(1 + ratePct / 100, t), 0);
// Its own rate of return: the rate where that sum is zero, found by halving the range.
const rateOfReturn = (cash) => {
  let lo = 0, hi = 100;
  for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (presentValue(cash, m) > 0) lo = m; else hi = m; }
  return (lo + hi) / 2;
};
const asFlows = (cash) => cash.map((v, t) => ({ t, v }));

if (F) {
  // Cost of equity: 4% risk-free, beta 1.2, 9% market -> 4 + 1.2 x 5 = 10%.
  say(near(call(() => F.costOfEquity(4, 1.2, 9)), 10, 1e-9), "cost of equity, 4% + 1.2 x (9% - 4%) = 10%", call(() => F.costOfEquity(4, 1.2, 9)));
  say(near(call(() => F.costOfEquity(3, 0, 8)), 3, 1e-9), "a beta of 0 earns the risk-free rate");
  // Funding-weighted cost: 70% equity at 10%, 30% debt at 6% after 25% tax -> 7 + 1.35 = 8.35%.
  say(near(call(() => F.wacc(10, 70, 6, 25)), 8.35, 1e-9), "cost of capital, 0.7 x 10% + 0.3 x 6% x 0.75 = 8.35%", call(() => F.wacc(10, 70, 6, 25)));
  say(near(call(() => F.wacc(10, 100, 6, 25)), 10, 1e-9), "all equity costs the cost of equity");
  // Hurdle: the cost of capital plus the project's risk, or the rate finance gives.
  say(near(call(() => F.hurdle(8.35, 3, false, 10)), 11.35, 1e-9), "hurdle, 8.35% + 3 points of project risk = 11.35%");
  say(near(call(() => F.hurdle(8.35, 3, true, 10)), 10, 1e-9), "a hurdle given by finance replaces the worked one");
  say(near(call(() => F.hurdle(8.35, 3, false, 10, 2)), 13.35, 1e-9), "a risk bump moves the hurdle by its points");

  // Value: spend 100 now, get 110 in a year, at 10% -> exactly zero.
  say(near(call(() => F.pv(asFlows([-100, 110]), 10)), 0, 1e-9), "100 spent for 110 a year later is worth nothing extra at 10%");
  say(near(call(() => F.pv([{ t: 0, v: -100 }, { t: 2, v: 121 }], 10)), 0, 1e-9), "121 two years out is worth 100 today at 10%");
  // Return: the same cases by hand.
  say(near(call(() => F.irr(asFlows([-100, 110]))), 10, 1e-6), "the return on 100 for 110 a year later is 10%", call(() => F.irr(asFlows([-100, 110]))));
  say(near(call(() => F.irr([{ t: 0, v: -1000 }, { t: 3, v: 1331 }])), 10, 1e-6), "the return on 1,000 for 1,331 three years later is 10%");
  const odd = [-1000, 400, 400, 400];
  say(near(call(() => F.irr(asFlows(odd))), rateOfReturn(odd), 1e-4), "the return on 1,000 for 400 a year, three years, matches this file's", rateOfReturn(odd).toFixed(4));
  say(call(() => F.irr(asFlows([-100, -50]))) === null, "no return exists when cash never turns positive");

  // DTOG's example, as the page opens: inputs give a 10% cost of equity, 8.35% cost of
  // capital, 11.35% hurdle; the project's cash as entered.
  const P = { inv: 250000, cf: [-20000, 60000, 100000, 130000, 140000], tv: false, g: 2 };
  const cash = [-P.inv, ...P.cf];
  const f = call(() => F.flows(P, 11.35));
  say(Array.isArray(f) && f.length === 6 && f[0].t === 0 && f[0].v === -250000 && f[5].t === 5 && f[5].v === 140000, "the example's cash, year 0 to year 5, as entered");
  const v = call(() => F.pv(f, 11.35));
  say(near(v, presentValue(cash, 11.35), 1e-6), "its value at 11.35% matches this file's sum", presentValue(cash, 11.35).toFixed(2));
  say(Math.round(v) === 19211, "its value rounds to DTOG's $19,211", Math.round(v));
  const r = call(() => F.irr(f));
  say(near(r, rateOfReturn(cash), 1e-4) && r.toFixed(2) === "13.50", "its return matches this file's, and DTOG's 13.50%", Number.isFinite(r) ? r.toFixed(4) : r);
  say(near(call(() => F.npvAt(P, 11.35)), v, 1e-9), "value at a rate is the flows' value at that rate");

  // Paybacks. Simple: running total -250,000, -270,000, -210,000, -110,000, +20,000 ->
  // during year 4, 3 + 110,000 / 130,000 years.
  say(near(call(() => F.payback(P.inv, P.cf, 0)), 3 + 110000 / 130000, 1e-9), "simple payback, 3 + 110,000 / 130,000 years", (3 + 110000 / 130000).toFixed(3));
  // Discounted at 11.35%: by hand, the same walk on discounted amounts.
  const dp = (() => { let cum = -P.inv; for (let i = 0; i < 5; i++) { const d = P.cf[i] / Math.pow(1.1135, i + 1); if (cum + d >= 0 && d > 0) return i + -cum / d; cum += d; } return null; })();
  say(near(call(() => F.payback(P.inv, P.cf, 11.35)), dp, 1e-9), "discounted payback at 11.35% matches this file's walk", dp === null ? "none" : dp.toFixed(3));
  say(call(() => F.payback(100, [10, 10, 10, 10, 10], 0)) === null, "no payback inside five years says so");
  say(call(() => F.payback(0, [10, 10, 10, 10, 10], 0)) === 0, "nothing spent pays back at once");

  // Sign changes: one is ordinary; two or more means the return can't be trusted.
  say(call(() => F.signChanges(f)) === 1, "the example's cash changes sign once");
  say(call(() => F.signChanges(asFlows([-100, 230, -132]))) === 2, "spend, earn, spend again changes sign twice");
  say(call(() => F.signChanges(asFlows([-100, 0, 50, 60]))) === 1, "a zero year is not a change");

  // Value after year 5: the year-5 cash grown at g, divided by (rate - g), at year 5.
  const Q = { ...P, tv: true, g: 2 };
  const ft = call(() => F.flows(Q, 11.35));
  const tvByHand = (140000 * 1.02) / (0.1135 - 0.02);
  say(Array.isArray(ft) && ft.length === 7 && ft[6].t === 5 && near(ft[6].v, tvByHand, 1e-6), "value after year 5, 140,000 x 1.02 / (11.35% - 2%)", tvByHand.toFixed(0));
  say(call(() => F.flows({ ...Q, g: 11.35 }, 11.35)) === null, "growth at the rate is refused");
  say(call(() => F.flows({ ...Q, g: 12 }, 11.35)) === null, "growth above the rate is refused");
  say(Number.isNaN(call(() => F.npvAt({ ...Q, g: 12 }, 11.35))), "and its value reads as not computable");

  // Scenario levers move the cash as the page says.
  const later = call(() => F.flows(P, 11.35, { shift: 0.5 }));
  say(Array.isArray(later) && later[1].t === 1.5 && later[0].t === 0, "six months later moves every year's cash, not the spend");
  const more = call(() => F.flows(P, 11.35, { scale: 1.2, inv: 0.8 }));
  say(Array.isArray(more) && near(more[0].v, -200000, 1e-9) && near(more[5].v, 168000, 1e-9), "20% more cash a year and 20% less spend");

  // Running totals for the chart.
  const cu = call(() => F.cumulative(P.inv, P.cf, 0));
  say(cu && Array.isArray(cu.u) && cu.u.length === 6 && cu.u[5] === 160000, "the running total ends at 160,000 undiscounted");
}

// ---------------------------------------------------------------- the page
const page = read("public/prodmanfinance/index.html");
say(!!page, "the page exists at /prodmanfinance/");
say(/^<!doctype html>/i.test(page.trim()) && /<html lang="en">/.test(page) && /<meta charset="utf-8"/i.test(page) && /<meta name="viewport"/.test(page), "it is a full document");
say(/<title>Finance for Product Managers — David Facer<\/title>/.test(page), "its tab reads Finance for Product Managers — David Facer");
say(/<h1>Finance for Product Managers<\/h1>/.test(page), "its heading reads Finance for Product Managers");
say(/class="eyebrow">Prototype · Will my project clear the bar\?</.test(page), "DTOG's question is kept above the heading");
say(/<script src="\/prodmanfinance\/finance\.js"><\/script>/.test(page), "it loads its sums from the tested file");
const scriptBody = (page.match(/<script>([\s\S]*?)<\/script>/) || [])[1] || "";
say(!/function irr\b|Math\.pow\(1 \+ r/.test(scriptBody), "and does no discounting of its own");
const outside = (page.match(/(?:src|href)="https?:\/\/[^"]+"/g) || []).filter((u) => !/fonts\.googleapis\.com|fonts\.gstatic\.com|davidfacer\.com/.test(u));
say(outside.length === 0, "it loads nothing from outside but Google Fonts", outside.join(" "));
say(!/<script src="https?:/.test(page), "no outside script");
say(!/fetch\(|XMLHttpRequest|localStorage|sessionStorage|sendBeacon|WebSocket|indexedDB|document\.cookie/.test(page), "it stores nothing and sends nothing");
// An input is labelled by aria-label, by a <label for> naming its id, or by sitting inside a <label>.
const inputs = [...page.matchAll(/<(?:input|select|textarea)\b([^>]*)>/g)].map((m) => ({ a: m[1], at: m.index }));
const unlabelled = inputs.filter(({ a, at }) => {
  if (/type="hidden"/.test(a) || /aria-label="/.test(a)) return false;
  const id = (a.match(/\bid="([^"]+)"/) || [])[1];
  if (id && new RegExp('<label[^>]*for="' + id + '"').test(page)) return false;
  if (page.lastIndexOf("<label", at) > page.lastIndexOf("</label>", at)) return false;
  return true;
});
say(inputs.length > 0 && unlabelled.length === 0, "every input carries a label (" + inputs.length + " inputs)", unlabelled.length ? unlabelled.length + " without" : "");

// ---------------------------------------------------------------- where it is listed
const protos = read("public/sampleprototypes/index.html");
say(/grid-cols-1/.test(protos) && !/sm:grid-cols-2/.test(protos), "the prototypes page shows its cards in one column");
const cards = protos.match(/<a href="[^"]+"[\s\S]*?<\/a>/g) || [];
const listed = cards.filter((c) => /<h2/.test(c));
say(listed.length === 3, "three cards", listed.length);
const fin = listed[0] || "";
say(/^<a href="\/prodmanfinance\/"/.test(fin) && !/target="_blank"/.test(fin), "the finance card comes first and opens on the site, in the same tab");
say(/Finance for Product Managers/.test(fin), "it is titled Finance for Product Managers");
say(fin.replace(/\s+/g, " ").includes("A tool for product managers to frame projects and initiatives in ways that will make their CFO love them."), "it carries the owner's description, word for word");
say(/href="\/complexity-sovereignty-assessment\/"/.test(listed[1] || "") && /dinotherapy/.test(listed[2] || ""), "then the assessment, then Dinosaur Comics Therapy");

const llms = read("public/llms.txt");
say(/\n\/prodmanfinance\/\n/.test(llms), "llms.txt lists /prodmanfinance/");
say(!/One is on this domain/.test(llms) && /Two are on this domain/.test(llms), "llms.txt says two prototypes are on this domain");
say(/the third is on a\s+separate subdomain/.test(llms), "and the third on the subdomain");
say(/\n## Prototypes on this domain\n/.test(llms) && !/\n## Prototype on this domain\n/.test(llms), "its heading names prototypes, plural");

const sitemap = read("public/sitemap.xml");
say(/<loc>https:\/\/davidfacer\.com\/prodmanfinance\/<\/loc>/.test(sitemap), "the sitemap lists it");
const cfg = read("next.config.js");
say(/'\/prodmanfinance\/'/.test(cfg), "the site serves it at its address");
let pkg = {};
try { pkg = JSON.parse(read("package.json")); } catch (e) { pkg = {}; }
say(/prodmanfinance-self-test\.js/.test((pkg.scripts || {}).prebuild || ""), "the site's build runs this test");

console.log(bad ? "\nSELF-TEST FAILED." : "\nSelf-test passed.");
process.exitCode = bad;
