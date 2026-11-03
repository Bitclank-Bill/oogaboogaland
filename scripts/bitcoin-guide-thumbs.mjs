// Bakes src/js/genesis-guide-thumbs.js, the Genesis museum's thumbnails for its Bitcoin Guide hall: every resource
// card's picture, the essays' and video essays' pictures, the reading list's and the dice guide's, from bitcoinguide.app
// (Bitcoin Bill's site, used with his permission). Run by hand: `node scripts/bitcoin-guide-thumbs.mjs <site dir>
// <assets dir>`, the site's source and its asset export (the `images/` folder and `manifest.json`, which names each
// file's address on the site). Each picture is scaled to fit 360x220 and written as a small WebP (ImageMagick's
// `convert`, required; a drawing in SVG goes in as it is), base64 into the module, keyed by what it belongs to. Nothing is fetched.
import { readFile, writeFile, mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { runInNewContext } from "node:vm";

const [dir, assets] = process.argv.slice(2);
if (!dir || !assets) { console.error("usage: node scripts/bitcoin-guide-thumbs.mjs <site dir> <assets dir>"); process.exit(1); }
const read = (f) => readFile(join(dir, f), "utf8");

// The literal after `const NAME =`, its brackets matched outside strings and comments (as bitcoin-guide-data.mjs).
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
const strings = (text) => { const s = {}; for (const m of text.matchAll(/const\s+([A-Z_]+)\s*=\s*(["'`])([^"'`]*)\2;/g)) s[m[1]] = m[3]; return s; };
const value = (text, name) => runInNewContext(`(${literal(text, name)})`, strings(text));

// What each picture belongs to: key -> its address on the site.
const want = new Map();
const res = await read("src/pages/Resources.jsx");
for (const s of value(res, "sections")) for (const l of s.links) if (l.thumbnail) want.set(`res:${l.title}`, l.thumbnail);
for (const e of value(await read("src/components/ArchiveSection.jsx"), "essays")) if (e.icon) want.set(`essay:${e.title}`, e.icon);
const vid = await read("src/pages/VideoEssays.jsx");
for (const r of value(vid, "REELS")) if (r.image && r.title) want.set(`video:${r.title}`, r.image);
const firstSrc = (t) => (t.match(/https:\/\/media\.base44\.com\/[^"'`\s)]+/) || [])[0];
const reading = firstSrc(await read("src/components/resources/ReadingListLink.jsx")); if (reading) want.set("reading", reading);
const dice = firstSrc(await read("src/pages/DiceEntropy.jsx")); if (dice) want.set("dice", dice);

const manifest = JSON.parse(await readFile(join(assets, "manifest.json"), "utf8"));
const byUrl = new Map(manifest.assets.filter((a) => a.url).map((a) => [a.url, a.path]));
const tmp = await mkdtemp(join(tmpdir(), "bg-thumbs-"));
const out = {}, cache = new Map(), missing = [];
let bytes = 0;
for (const [key, url] of want) {
  const path = byUrl.get(url);
  if (!path) { missing.push(key); continue; }
  if (!cache.has(path)) {
    // A drawing (SVG) goes in as it is; a picture is scaled down to a WebP.
    let b64, type = "image/webp";
    if (/\.svg$/i.test(path)) { b64 = (await readFile(join(assets, path))).toString("base64"); type = "image/svg+xml"; } else {
      const dst = join(tmp, `${cache.size}.webp`);
      execFileSync("convert", [join(assets, path) + "[0]", "-auto-orient", "-resize", "360x220>", "-strip", "-quality", "72", dst]);
      b64 = (await readFile(dst)).toString("base64");
    }
    bytes += b64.length;
    cache.set(path, `data:${type};base64,${b64}`);
  }
  out[key] = cache.get(path);
}
await writeFile(new URL("../src/js/genesis-guide-thumbs.js", import.meta.url), `// Baked by scripts/bitcoin-guide-thumbs.mjs from bitcoinguide.app's pictures (Bitcoin Bill's site): the Bitcoin Guide
// hall's thumbnails, keyed "res:<resource title>", "essay:<title>", "video:<title>", "reading" and "dice". Data, no code.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  BL.bitcoinGuideThumbs = ${JSON.stringify(out)};
})();
`);
console.log(`thumbs ${Object.keys(out).length} (${cache.size} pictures, ${Math.round(bytes / 1024)} KB), missing ${missing.length}${missing.length ? `: ${missing.join(", ")}` : ""}`);
