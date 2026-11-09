// The Block Frenzy watch door must leave Ghost Hunter, Block Frenzy, voice and the Worker alone: run from a checkout with
// the base commit available (`node test/arcade-portal-diff.mjs [base]`, default the multiplayer head this branch merged). It
// fails if a guarded file changed, if `scene-block.js` changed beyond the door's way back, or if a changed line in the shared
// arcade files touches the hall's `HAUNT` or `BLOCK_HALL` data or the `blockHall` and `haunt` builders.
import { execFileSync } from "node:child_process";
const base = process.argv[2] || "8464c4daed033252a189c2ea99e8e2acfaf1a73b", git = (...a) => execFileSync("git", a, { encoding: "utf8" });
const names = git("diff", "--name-only", base, "--").trim().split("\n").filter(Boolean);
const guarded = names.filter((f) => /^(worker\/|src\/js\/(ghost-|haunt-models|block-|voice-blend|zone-map))/.test(f));
const removed = ["src/js/arcade-models.js", "src/js/arcade-scene-models.js", "src/js/scene-arcade.js"].flatMap((f) => git("diff", "-U0", base, "--", f).split("\n").filter((l) => /^-[^-]/.test(l)));
const hit = removed.filter((l) => /const HAUNT\b|const BLOCK_HALL\b|const haunt = BL|const blockHall = cached|caveSign\("Ghost Hunter"|ghostSign/.test(l));
const sceneBlock = git("diff", "-U0", base, "--", "src/js/scene-block.js").split("\n").filter((l) => /^[-+][^-+]/.test(l)).filter((l) => !/doorVisit|chairsBounce|goHome|go\(home\)|onChairsFull|came through the arcade|watchVisit = ctx\.place|arriving for the chairs|showDeck|seatViewer|round\.watchFeed\(true\)|No round running/i.test(l));
hit.push(...sceneBlock);
if (guarded.length || hit.length) { console.error("watch door touched guarded code:", guarded, hit); process.exit(1); }
console.log(`ok: ${names.length} files changed, none guarded; no guarded line in the shared arcade files changed`);
