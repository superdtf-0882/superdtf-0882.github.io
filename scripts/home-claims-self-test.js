#!/usr/bin/env node
// Self-test for OKF-TOGAF#237: davidfacer.com frames David's work as product
// leadership, every claim on it ends on his record or a public proof, and it
// asks for one conversation. A doubting visitor picking any number on the page
// must find it somewhere they can open.
//
// What it holds the site to:
//   - every number and number word on the home page, in its description, its
//     structured data and llms.txt is in scripts/home-claims.json, with where
//     it ends;
//   - each of the three areas has its claim, outcome and proof, in that order,
//     and an outcome carrying a number links to the CV download;
//   - the hero asks for one thing, and sends nobody off the site;
//   - the CV page carries the listed titles;
//   - the CV download is the file the list was read against, by its SHA-256.
//
// RULE-10 CROSSING, DECLARED: this runs in prebuild, so a change to that wiring
// is the way around it. It cannot read a PDF: it holds the list and the
// fingerprint, not the download's text, so a number missing from the download
// passes until someone reads the two together. A claim in words, with no
// number, is not caught here.
// Offline; exit 1 on a failing case.
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

let bad = 0;
const say = (ok, name, shown) => {
  console.log("  " + (ok ? "PASS" : "FAIL") + "  " + name + (shown ? "   " + shown : ""));
  if (!ok) bad = 1;
};
const pub = (p) => path.join(__dirname, "..", "public", p);
const read = (p) => fs.readFileSync(pub(p), "utf8").replace(/\r\n/g, "\n");
const list = JSON.parse(fs.readFileSync(path.join(__dirname, "home-claims.json"), "utf8"));
const home = read("index.html");
const cv = read("professional/cv/index.html");
const llms = read("llms.txt");

const entities = (s) => s.replace(/&nbsp;/g, " ").replace(/&ndash;/g, "-").replace(/&mdash;/g, "-")
  .replace(/&amp;/g, "&").replace(/&rsquo;/g, "'").replace(/&middot;/g, " ");
const visible = (h) => entities(h
  .slice(h.indexOf("<body"))
  .replace(/<script[\s\S]*?<\/script>/g, " ")
  .replace(/<svg[\s\S]*?<\/svg>/g, " ")
  .replace(/<!--[\s\S]*?-->/g, " ")
  .replace(/<[^>]+>/g, " "));
const description = (/<meta name="description" content="([^"]*)"/.exec(home) || [])[1] || "";
const ld = (/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(home) || [])[1] || "";
let data = null;
try { data = JSON.parse(ld); } catch (e) { data = null; }

// The text a visitor or a machine reads, each with URLs out of it: a digit in an
// address is not a claim.
const surfaces = {
  "the home page": visible(home),
  "its description": entities(description),
  "its structured data": ld.replace(/https?:\/\/[^"\s]+/g, " "),
  "llms.txt": llms.replace(/https?:\/\/[^\s)]+/g, " ").replace(/\d{4}-\d{2}-\d{2}/g, " "),
};
const known = new Set(list.numbers.map((n) => n.text));
const words = new Set(list.words.map((w) => w.text.toLowerCase()));
const WORD = /\b(two|three|four|five|six|seven|eight|nine|ten|twice|thrice|doubled|tripled|quadrupled)\b/gi;
const NUMBER = /\$?\d+(?:\.\d+)?[%MKB+]?/g;

console.log("every number ends somewhere");
for (const [name, text] of Object.entries(surfaces)) {
  const nums = (text.replace(/AI-Native/g, "").match(NUMBER) || []).filter((t) => !known.has(t));
  say(nums.length === 0, name + ": each number is listed", nums.join(" "));
  const said = (text.match(WORD) || []).map((w) => w.toLowerCase()).filter((w) => !words.has(w));
  say(said.length === 0, name + ": each number word is listed", said.join(" "));
}
const page = surfaces["the home page"];
const stale = list.numbers.filter((n) => !page.includes(n.text) && !surfaces["llms.txt"].includes(n.text)).map((n) => n.text);
say(stale.length === 0, "the list names nothing the page no longer says", stale.join(" "));

console.log("the three areas");
const dl = "/" + list.download.path;
const areas = (home.match(/<li data-area[ >][\s\S]*?<\/li>/g) || []);
say(areas.length === 3, "three areas", String(areas.length));
areas.forEach((a, i) => {
  const at = ["claim", "outcome", "proof"].map((p) => a.indexOf('data-part="' + p + '"'));
  say(at[0] >= 0 && at[0] < at[1] && at[1] < at[2], "area " + (i + 1) + ": claim, outcome, proof, in that order");
  const out = (/data-part="outcome"[\s\S]*?(?=data-part="proof")/.exec(a) || [""])[0];
  const hasNumber = list.numbers.some((n) => entities(out).includes(n.text)) ||
    list.words.some((w) => new RegExp("\\b" + w.text + "\\b", "i").test(out));
  say(!hasNumber || out.includes('href="' + dl + '"'), "area " + (i + 1) + ": a number in its outcome links to the CV download");
  say(/data-part="proof"[\s\S]*?href="/.test(a), "area " + (i + 1) + ": its proof is a link");
});
say(/the CV download/.test(page), "the sentence under the areas names the CV download, not the CV");
say(!/governance plane are public/i.test(page), "nothing says more is public than a visitor can open");

console.log("one action");
const hero = (/<header[\s\S]*?<\/header>/.exec(home) || [""])[0];
say((hero.match(/href="mailto:/g) || []).length === 1, "the hero asks for one conversation");
say(!/href="https?:/.test(hero), "the hero sends nobody off the site");
say(/href="#how-i-work"/.test(hero), "the hero points down the page");
say(/david\.facer@davidfacer\.com/.test(hero), "the conversation is an email");

console.log("words that are gone");
for (const gone of ["Practice Areas", "RAG retrieval", "LLM Direct Bypass", "won awards", "award-winning"]) {
  say(!new RegExp(gone, "i").test(home + llms), "no \"" + gone + "\"");
}

say(!/>Practice Areas</.test(cv), "the CV page has no \"Practice Areas\" heading");

console.log("structured data");
say(!!data, "it parses");
const person = (data && data.mainEntity) || {};
const heading = entities((/<h1[^>]*>([\s\S]*?)<\/h1>/.exec(home) || ["", ""])[1]).trim();
say(data && data["@type"] === "ProfilePage" && person["@type"] === "Person", "a ProfilePage about a Person");
say(person.name === "David Facer", "his name");
say(person.jobTitle === "Strategy & AI Architecture Consultant" && person.jobTitle !== heading, "a job title, not the page's heading");
say(Array.isArray(person.sameAs) && list.links.filter((l) => /linkedin|github|substack/.test(l)).every((l) => person.sameAs.includes(l)), "his public profiles");

console.log("llms.txt");
say(!/\b(you should|you must|instruct\w*|ignore|LLMs?|assistants?|please)\b/i.test(surfaces["llms.txt"]), "no line addressed to a model");
say(/\]\(https:\/\/davidfacer\.com\/professional\/cv\/David_Facer_CV\.pdf\)/.test(llms), "it lists the CV download");

console.log("links");
const out = [...new Set((home.slice(home.indexOf("<body")).match(/href="https?:[^"]+"/g) || []).map((h) => h.slice(6, -1)))];
const unlisted = out.filter((u) => !list.links.includes(u));
say(unlisted.length === 0, "each outside link is listed, so each can be requested before a push", unlisted.join(" "));

console.log("the CV");
const missing = list.titles.filter((t) => !cv.includes(">" + t + "</div>"));
say(missing.length === 0, "the CV page carries the listed titles", missing.join(" | "));
say(/href="\/professional\/cv\/David_Facer_CV\.pdf"/.test(home) && /href="\/professional\/cv\/David_Facer_CV\.pdf"/.test(cv), "the download is in the navigation of both pages");
const file = pub(list.download.path);
const has = fs.existsSync(file);
say(has, "the download exists");
const sum = has ? crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex") : "";
say(has && sum === list.download.sha256, "the download is the file the list was read against");

console.log(bad ? "HOME CLAIMS SELF-TEST FAIL" : "HOME CLAIMS SELF-TEST PASS");
process.exit(bad);
