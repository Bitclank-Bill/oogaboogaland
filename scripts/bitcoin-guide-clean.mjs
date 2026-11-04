// The Genesis museum's rules for the links it takes from bitcoinguide.app (src/js/genesis-guide-data.js), applied by
// scripts/bitcoin-guide-data.mjs as it bakes, and runnable on its own to clean the committed file in place:
// `node scripts/bitcoin-guide-clean.mjs`.
//   - No unofficial or unauthorized copies: a PDF on a link shortener or Linktree, or an entry calling itself
//     unofficial, is replaced by its official page where there is one (OFFICIAL) and dropped otherwise.
//   - No referral or tracking codes: query parameters such as ref, r, utm_*, s and si come off every URL.
import { readFile, writeFile } from "node:fs/promises";

// Official pages for copies the site links: the whitepaper as bitcoin.org serves it, and the book from its publisher.
const OFFICIAL = new Map([
  ["https://ugc.production.linktr.ee/301f8849-6738-45d3-b07a-93e78aac039f_bitcoin-whitepaper.pdf", "https://bitcoin.org/bitcoin.pdf"],
  ["https://ugc.production.linktr.ee/bf8cd524-1547-43ae-a11f-c3d8613db5d5_Gradually-Then-Suddenly.pdf", "https://thesaifhouse.com/"]
]);
const TRACKING = /^(ref|r|s|si|t|utm_[a-z_]+|shareImageVariant|aff|affiliate|referral|via|fbclid|gclid|mc_cid|mc_eid)$/i;
const UNOFFICIAL_HOST = /(^|\.)(tr\.ee|linktr\.ee)$/i;

export const cleanUrl = (url) => {
  if (!/^https?:\/\//.test(url)) return url;
  if (OFFICIAL.has(url)) return OFFICIAL.get(url);
  const u = new URL(url);
  for (const k of [...u.searchParams.keys()]) if (TRACKING.test(k)) u.searchParams.delete(k);
  return u.toString().replace(/\?$/, "");
};
// Whether a link is an unofficial copy the museum leaves out (after any official replacement).
const unofficial = (url, text) => {
  if (/unofficial/i.test(text || "")) return true;
  if (!/^https?:\/\//.test(url)) return false;
  return UNOFFICIAL_HOST.test(new URL(url).hostname);
};

// Whether the museum keeps a site link (its thumbnail too): false for the copies `clean` drops.
export const kept = (l) => !unofficial(cleanUrl(l.url || ""), `${l.title || ""} ${l.description || ""}`);
export const clean = (data) => {
  const dropped = [];
  for (const s of data.sections) {
    s.links = s.links.filter((l) => { const keep = !unofficial(cleanUrl(l.url), `${l.title} ${l.description}`); if (!keep) dropped.push(l.title); return keep; });
    for (const l of s.links) l.url = cleanUrl(l.url);
  }
  data.further = data.further.filter((f) => { const keep = !unofficial(cleanUrl(f.url), `${f.title} ${f.description}`); if (!keep) dropped.push(f.title); return keep; });
  for (const f of data.further) { f.url = cleanUrl(f.url); for (const l of f.links) l.url = cleanUrl(l.url); }
  for (const e of data.essays) { e.pdf = cleanUrl(e.pdf); if (e.reel) e.reel = cleanUrl(e.reel); }
  return dropped;
};

// Run on its own: clean the committed data file in place, keeping its wrapper.
if (import.meta.url === `file://${process.argv[1]}`) {
  const file = new URL("../src/js/genesis-guide-data.js", import.meta.url), text = await readFile(file, "utf8");
  const at = text.indexOf("BL.bitcoinGuideData = ") + "BL.bitcoinGuideData = ".length, end = text.lastIndexOf(";\n})();");
  const data = JSON.parse(text.slice(at, end)), dropped = clean(data);
  const body = JSON.stringify(data).split(String.fromCharCode(0x2028)).join(" ").split(String.fromCharCode(0x2029)).join(" ");
  await writeFile(file, text.slice(0, at) + body + text.slice(end));
  console.log(`dropped ${dropped.length}: ${dropped.join(" | ")}`);
}
