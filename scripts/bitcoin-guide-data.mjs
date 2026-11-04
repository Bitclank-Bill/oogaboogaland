// Bakes src/js/genesis-guide-data.js, the Genesis museum's copy of Bitclank Bill's essays from bitcoinguide.app (his
// site, used with his permission): the twelve essays with their full text, their PDFs, and the video essays' reels
// and slides. Nothing else of the site is taken. Run by hand against a checkout or export of the site's source:
// `node scripts/bitcoin-guide-data.mjs <dir>`. It reads the data arrays out of the site's own files and evaluates only
// those literals (no imports run), and the essays' text from the functions that build their PDFs (heading, para and
// bullet calls). Links go through scripts/bitcoin-guide-clean.mjs: no unofficial copies, no referral or tracking codes.
import { readFile, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { runInNewContext } from "node:vm";
import { clean } from "./bitcoin-guide-clean.mjs";

const dir = process.argv[2];
if (!dir) { console.error("usage: node scripts/bitcoin-guide-data.mjs <bitcoinguide source dir>"); process.exit(1); }
const read = (f) => readFile(join(dir, f), "utf8");

// The literal after `const NAME =`, its brackets matched outside strings, comments and template literals.
const literal = (text, name) => {
  const m = new RegExp(`(?:export\\s+)?const\\s+${name}\\s*=\\s*`).exec(text);
  if (!m) throw new Error(`no ${name}`);
  let i = m.index + m[0].length, depth = 0, q = null;
  const start = i;
  for (; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === "\\") i++; else if (c === q) q = null; continue; }
    if (c === "/" && text[i + 1] === "/") { i = text.indexOf("\n", i); continue; }
    if (c === "/" && text[i + 1] === "*") { i = text.indexOf("*/", i) + 1; continue; }
    if (c === '"' || c === "'" || c === "`") { q = c; continue; }
    if (c === "[" || c === "{" || c === "(") depth++;
    else if (c === "]" || c === "}" || c === ")") { depth--; if (!depth) return text.slice(start, i + 1); }
  }
  throw new Error(`unclosed ${name}`);
};
const value = (text, name, scope = {}) => runInNewContext(`(${literal(text, name)})`, scope);
// String constants a literal leans on (`const BASE = "..."`).
const strings = (text) => { const s = {}; for (const m of text.matchAll(/const\s+([A-Z_]+)\s*=\s*(["'`])([^"'`]*)\2;/g)) s[m[1]] = m[3]; return s; };

const archive = await read("src/components/ArchiveSection.jsx");
const essays = value(archive, "essays");
const videoText = await read("src/pages/VideoEssays.jsx");
const reels = value(videoText, "REELS", strings(videoText));

// The essays' text: each PDF function's content block run with stand-ins that record its calls.
const PDF = { "Evolution of Money": "Money", "Game Theory": "GameTheory", "Gresham's Law": "GreshamsLaw", "Low Time Preference": "LowTimePreference",
  "Innovations: Zero to One": "Innovations", "Value": "Value", "Liminal State of Fiat": "LiminalState", "Cognitive Dissonance": "CognitiveDissonance",
  "Monetary Abuse": "MonetaryAbuse", "Human Nature": "HumanNature", "Intuition": "Intuition", "Conclusion": "Conclusion" };
const KINDS = { heading: "h", subheading: "h", sectionHeading: "h", para: "p", paragraph: "p", bullet: "b", labeledBullet: "b", numbered: "b", parallel: "b", quote: "q" };
const prose = async (fn) => {
  const src = await read(`base44/functions/generate${fn}Pdf/entry.ts`), out = [];
  // Every statement-level call of a content function, in order: its arguments' literal read in a sandbox.
  for (const m of src.matchAll(/^[ \t]*(heading|subheading|sectionHeading|para|paragraph|bullet|labeledBullet|numbered|parallel|quote)\(/gm)) {
    const args = literal(`const A = ${src.slice(m.index + m[0].length - 1)}`, "A");
    let v;
    try { v = runInNewContext(`[${args.slice(1, -1)}]`, {}); } catch { continue; }
    const t = v.filter((x) => typeof x === "string");
    if (!t.length) continue;
    const k = KINDS[m[1]];
    if (m[1] === "parallel") { out.push(["h", `${t[0]}. ${t[1]}`]); for (const x of t.slice(2)) out.push(["p", x]); } else out.push(k === "b" && t.length > 1 ? ["b", `${t[0]}: ${t.slice(1).join(" ")}`] : [k, t.join(" ")]);
  }
  if (!out.length) throw new Error(`no content in ${fn}`);
  return out;
};
const slidesFor = async (title) => {
  const files = await readdir(join(dir, "src/components/video"));
  const key = PDF[title] === "Money" ? "Money" : PDF[title];
  const f = files.find((x) => x === `${key}Slides.jsx`);
  if (!f) return [];
  const t = await read(`src/components/video/${f}`);
  return value(t, "SLIDES", strings(t)).map((s) => ({ title: s.title, subtitle: s.subtitle || "" }));
};
const data = {
  site: "https://bitcoinguide.app",
  essays: await Promise.all(essays.map(async (e, i) => ({ title: e.title, accent: e.accent, description: e.description, pdf: e.url, reel: reels[i] ? reels[i].video || reels[i].url || "" : "", text: await prose(PDF[e.title]), slides: await slidesFor(e.title) })))
};
// No unofficial copies and no tracking codes (scripts/bitcoin-guide-clean.mjs).
clean(data);
const body = JSON.stringify(data).split(String.fromCharCode(0x2028)).join(" ").split(String.fromCharCode(0x2029)).join(" ");
await writeFile(new URL("../src/js/genesis-guide-data.js", import.meta.url), `// Baked by scripts/bitcoin-guide-data.mjs from bitcoinguide.app's source (Bitcoin Bill's site): Bitclank Bill's
// essays, their PDFs and the video essays' reels and slides, for the Genesis museum. Data, no code.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  BL.bitcoinGuideData = ${body};
})();
`);
console.log(`essays ${data.essays.length} (${data.essays.map((e) => e.text.length).join(",")} blocks)`);
