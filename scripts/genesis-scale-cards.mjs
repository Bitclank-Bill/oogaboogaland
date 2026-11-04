// Bakes src/js/genesis-scale-cards.js: the Genesis museum's site model's pictures of the places it shows, from the
// site's own preview cards (cards/, captured by scripts/cards.mjs), scaled to 480 wide as WebP (ImageMagick's
// `convert`, required) and base64 into the module, keyed by the model's zone id. Run by hand: `node
// scripts/genesis-scale-cards.mjs`, again after `npm run cards` makes new cards.
import { readFile, writeFile, mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";

const root = new URL("..", import.meta.url).pathname;
const CARDS = { pile: "home", lab: "entropylab", factory: "lightning", arcade: "oogarally", mempool: "mempool", timechain: "sphere" };
const tmp = await mkdtemp(join(tmpdir(), "scale-cards-")), out = {};
for (const [id, name] of Object.entries(CARDS)) {
  const dst = join(tmp, `${id}.webp`);
  execFileSync("convert", [join(root, "cards", `${name}.jpg`), "-resize", "480x", "-strip", "-quality", "70", dst]);
  out[id] = `data:image/webp;base64,${(await readFile(dst)).toString("base64")}`;
}
await writeFile(join(root, "src/js/genesis-scale-cards.js"), `// Baked by scripts/genesis-scale-cards.mjs from the site's preview cards (cards/): the Genesis museum's site model's
// pictures of the places it shows, keyed by its zone id. Data, no code.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  BL.genesisScaleCards = ${JSON.stringify(out)};
})();
`);
console.log(`cards ${Object.keys(out).length}, ${Math.round(Object.values(out).reduce((a, s) => a + s.length, 0) / 1024)} KB`);
