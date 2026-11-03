// Bakes src/js/genesis-guide-data.js, the Genesis museum's copy of bitcoinguide.app's content (Bitcoin Bill's site,
// used with his permission): the twelve essays with their full text, the further reading, the resources page's
// sections and links, the reading list, the learning paths, the video essays' reels and slides, the dice and
// passphrase guides' steps and notes, and the landing page's sections. Run by hand against a checkout or export of
// the site's source: `node scripts/bitcoin-guide-data.mjs <dir>`. It reads the data arrays out of the site's own
// files and evaluates only those literals (no imports run), and the essays' text from the functions that build their
// PDFs (heading, para and bullet calls). Pictures stay on the site: only their addresses are kept, never fetched.
import { readFile, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { runInNewContext } from "node:vm";

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
const further = ["saifedeanItems", "parkerLewisItems", "farringtonItems", "unchainedItems"].flatMap((n) => { try { return value(archive, n); } catch { return []; } });
const resText = await read("src/pages/Resources.jsx");
const colors = value(resText, "SECTION_COLORS");
const sections = value(resText, "sections").map((s, i) => ({ title: s.title, subtitle: s.subtitle || "", color: colors[i % colors.length], noLinks: !!s.disableUrls,
  links: s.links.map((l) => ({ title: l.title, url: l.url || "", description: l.description || "" })) }));
const readingList = value(await read("src/components/resources/ReadingListLink.jsx"), "readingList");
const paths = value(await read("src/components/PathsSection.jsx"), "paths");
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
const guides = {};
for (const [k, fn] of [["dice", "DiceEntropy"], ["coldStorage", "ColdStorageGuide"], ["airGapped", "AirGappedThinkPad"]]) { try { guides[k] = await prose(fn); } catch (e) { console.warn(`${fn}: ${e.message}`); } }
const diceText = await read("src/pages/DiceEntropy.jsx"), passText = await read("src/pages/Passphrase.jsx");
// A page's steps may hold JSX fragments (`<>Change it to <strong>Dice</strong>.</>`): read as their text.
const unJsx = (t) => t.replace(/<>([\s\S]*?)<\/>/g, (_, inner) => JSON.stringify(inner.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()));
const tryValue = (t, n) => { try { return value(unJsx(t), n); } catch (e) { console.warn(`${n}: ${e.message}`); return null; } };

const data = {
  site: "https://bitcoinguide.app",
  essays: await Promise.all(essays.map(async (e, i) => ({ title: e.title, accent: e.accent, description: e.description, pdf: e.url, reel: reels[i] ? reels[i].video || reels[i].url || "" : "", text: await prose(PDF[e.title]), slides: await slidesFor(e.title) }))),
  further: further.map((f) => ({ title: f.title, author: f.author || "", description: f.description || "", url: f.url || (f.links && f.links[0] && f.links[0].url) || "", links: (f.links || []).map((l) => ({ label: l.label || l.title || "", url: l.url })) })),
  sections, readingList, paths, guides,
  dice: { steps: tryValue(diceText, "steps"), notes: tryValue(diceText, "notes") },
  passphrase: { steps: tryValue(passText, "steps"), notes: tryValue(passText, "notes") }
};
const body = JSON.stringify(data).split(String.fromCharCode(0x2028)).join(" ").split(String.fromCharCode(0x2029)).join(" ");
await writeFile(new URL("../src/js/genesis-guide-data.js", import.meta.url), `// Baked by scripts/bitcoin-guide-data.mjs from bitcoinguide.app's source (Bitcoin Bill's site): its essays, resources,
// reading list, paths, video essays and guides, for the Genesis museum's Bitcoin Guide hall. Data, no code.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  BL.bitcoinGuideData = ${body};
})();
`);
console.log(`essays ${data.essays.length} (${data.essays.map((e) => e.text.length).join(",")} blocks), further ${data.further.length}, sections ${sections.length} (${sections.reduce((a, s) => a + s.links.length, 0)} links), books ${readingList.length}, paths ${paths.length}, guides ${Object.keys(guides).join(",")}`);
