#!/usr/bin/env node
// Self-test for OKF-TOGAF#211: davidfacer.com as a narrow professional site,
// with one path to aimaturitymodels.com. On "Start #211: the home page,
// Prototypes and the llms.txt check now, the CV page when my new draft is
// ready, and bring me the one sentence to approve -- David Facer 10/18/2026"
// (OKF TOGAF briefs/2026-10-01-svm-tranche-3/487-CC). The declared reach:
// davidfacer.com says what the practice does for whom, shows the CV and
// contact, and sends the curious to aimaturitymodels.com.
//
// What it holds the pages to:
//   - the home page carries one sentence and the professional links, and
//     nothing of the Independent Research column, its "Or" dividers or the
//     superdtf Substack; its meta description follows;
//   - the Economic Complexity & Sovereignty Assessment is on Prototypes,
//     labelled a prototype, and off the home page;
//   - llms.txt describes the site as it now is, names no count or list of the
//     maturity models (a list went stale once already: it said four), and
//     describes the assessment as what it is, a reading of nations.
// Offline; exit 1 on a failing case.
"use strict";

const fs = require("fs");
const path = require("path");

let bad = 0;
const say = (ok, name) => {
  console.log("  " + (ok ? "PASS" : "FAIL") + "  " + name);
  if (!ok) bad = 1;
};
const read = (p) => fs.readFileSync(path.join(__dirname, "..", "public", p), "utf8").replace(/\r\n/g, "\n");
const home = read("index.html");
const protos = read("sampleprototypes/index.html");
const llms = read("llms.txt");
const desc = (/<meta name="description" content="([^"]*)"/.exec(home) || [])[1] || "";

console.log("home page");
say(!/Independent research/i.test(home), "no Independent Research column");
say(!/superdtf\.substack\.com/.test(home), "no superdtf Substack link");
say(!/>\s*Or\s*</.test(home), "no \"Or\" divider");
say(!/complexity-sovereignty-assessment/.test(home), "the assessment is not on the home page");
say(/<h1[^>]*>\s*[^<\s][^<]{20,}<\/h1>/.test(home), "one sentence, as the page's heading");
say(/href="https:\/\/aimaturitymodels\.com\/?"/.test(home), "one link to aimaturitymodels.com");
say(/href="\/professional\/cv\/"/.test(home), "the CV");
say(/href="mailto:david\.facer@davidfacer\.com"/.test(home), "contact, by email");
say(/href="https:\/\/maturitymodel\.substack\.com\/?"/.test(home), "the Professional Substack stays");
say(/href="\/sampleprototypes\/"/.test(home), "Prototypes");
say(/href="https:\/\/www\.linkedin\.com\/in\/davidfacer"/.test(home), "LinkedIn, the owner's profile");
say(!!desc && !/geopolitics|economic complexity|political philosophy|independent research/i.test(desc), "the meta description follows");

console.log("prototypes");
say(/href="\/complexity-sovereignty-assessment\/"/.test(protos), "the assessment is on Prototypes");
say(/Economic Complexity &amp; Sovereignty Assessment/.test(protos), "under its name");
say(/prototypes\.davidfacer\.com\/dinotherapy/.test(protos), "DinoTherapy stays");

console.log("CV");
const cv = read("professional/cv/index.html");
say(/Enterprise Architecture &amp; AI-Native Governance/.test(cv), "the owner's new practice area, AI-native governance");
say((cv.match(/<h3 class="font-display text-paper text-base mb-2">/g) || []).length === 4, "four practice areas");
say((cv.match(/whitespace-nowrap">[A-Z][a-z]{2} \d{4} &ndash;/g) || []).length === 10, "ten roles in the chronology");
say(/Strategy &amp; AI Architecture Consultant/.test(cv), "the current role under its new title");
say(/href="https:\/\/davidfacer\.com\/"/.test(cv), "davidfacer.com as a link");
say(/href="https:\/\/www\.linkedin\.com\/in\/davidfacer"/.test(cv), "LinkedIn in the contact line");
say(/Toyoda over Taylor\./.test(cv) && /EA OKF/.test(cv), "the draft's own words carried, not paraphrased");

console.log("old pages taken down");
const exists = (p) => fs.existsSync(path.join(__dirname, "..", "public", p));
const config = fs.readFileSync(path.join(__dirname, "..", "next.config.js"), "utf8");
const sitemap = read("sitemap.xml");
say(!exists("professional/index.html"), "the /professional/ overview page is gone");
say(!exists("professional/enterprise-architecture/index.html") && !exists("professional/enterprise-architecture/sdlc-maturity/index.html"), "the retired EA pages' leftover files are gone");
say(exists("professional/cv/index.html"), "the CV stays");
say(/source:\s*'\/professional\/',\s*destination:\s*'\/',\s*permanent:\s*true/.test(config), "/professional/ forwards to the home page");
say(/source:\s*'\/professional\/enterprise-architecture\/'/.test(config), "the EA page's forward stays");
say(!/'\/professional\/',\n/.test(config.slice(config.indexOf("staticPages"), config.indexOf("];"))) && !/'\/professional\/enterprise-architecture\/'/.test(config.slice(config.indexOf("staticPages"), config.indexOf("];"))), "no rewrite to a page that is gone");
say(!/<loc>https:\/\/davidfacer\.com\/professional\/<\/loc>/.test(sitemap) && /professional\/cv\//.test(sitemap), "the sitemap lists the CV, not the overview");

console.log("llms.txt");
say(!/^\/professional\/\n/m.test(llms), "no /professional/ entry");
say(!/research hub|open-source intelligence research/i.test(llms), "no longer a research hub");
say(!/superdtf\.substack\.com/.test(llms), "no superdtf Substack");
say(!/\b(two|three|four|five|six) published maturity models\b/i.test(llms) && !/\bFour published\b/.test(llms), "no count of the maturity models");
say(!/Product Prioritization/.test(llms), "no retired model name");
say(/Strata, the architectural\s+governance plane/.test(llms), "Strata in the owner's words");
say(!/leadership team to use on itself/.test(llms) && /nations?\b|countr(y|ies)\b/i.test(llms), "the assessment read as what it is, a reading of nations");
say(/last revised 2026-11-04/.test(llms), "the revision date");

console.log(bad ? "PROFESSIONAL SITE SELF-TEST FAIL" : "PROFESSIONAL SITE SELF-TEST PASS");
process.exit(bad);
