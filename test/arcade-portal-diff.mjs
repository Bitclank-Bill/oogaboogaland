// The Block Frenzy watch door must leave Ghost Hunter, Block Frenzy, voice and the Worker alone: run from a checkout with
// the base commit available (`node test/arcade-portal-diff.mjs [base]`). It fails if a guarded file changed or a changed
// line in the shared arcade files touches the hall's `HAUNT` or `BLOCK_HALL` data or the `blockHall` and `haunt` builders.
import { execFileSync } from "node:child_process";
const base = process.argv[2] || "e462d499", git = (...a) => execFileSync("git", a, { encoding: "utf8" });
const names = git("diff", "--name-only", base, "--").trim().split("\n").filter(Boolean);
const guarded = names.filter((f) => /^(worker\/|src\/js\/(ghost-|haunt-models|block-|scene-block|voice-blend|zone-map))/.test(f));
const removed = ["src/js/arcade-models.js", "src/js/arcade-scene-models.js", "src/js/scene-arcade.js"].flatMap((f) => git("diff", "-U0", base, "--", f).split("\n").filter((l) => /^-[^-]/.test(l)));
const hit = removed.filter((l) => /const HAUNT\b|const BLOCK_HALL\b|const haunt = BL|const blockHall = cached|caveSign\("Ghost Hunter"|ghostSign/.test(l));
if (guarded.length || hit.length) { console.error("watch door touched guarded code:", guarded, hit); process.exit(1); }
console.log(`ok: ${names.length} files changed, none guarded; no guarded line in the shared arcade files changed`);
