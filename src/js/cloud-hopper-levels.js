// Cloud Hopper's levels: plain data, loadable in Node (docs/cloud-hopper-levels-plan.md 2.1–2.4).
// A level's `route` is its route distance R in metres: horizontal, along the course axis, from the launch
// cloud's centre to the final cloud's centre 12 m off the coast. Level 1 is 21% shorter than the old course
// (430.5 m) and each level after it 42% longer than the one before. The start stands that far out from the
// final cloud and `slope` × R above it. `layout` and `timing` override cloud-hopper-course.js's LAYOUT and
// TIMING; `board` is its shared high-score game and machine (highscore-rules.js). `sky` is the level's own fixed
// sky for a run (plan 4 and 7a), sampled at `hour` on the equinox: how much painted cloud it has, whether its
// clouds take the night fill (cloud-hopper-models.js, for L3's night and L4's storm), a `storm` greying of the sky
// with its `fog` [near, far] haze, its `scenery` (cloud-hopper-sky.js) and whether `tornado`es form in it
// (cloud-hopper-tornado.js). A layout's `xray`, `updraft` and `hook`
// are how many of each power-up its course carries (plan 3), its `gusts` how many gusts of wind blow across it
// (cloud-hopper-gust.js), each blowing `gustBlow` seconds and pushing `gustPush` of the full push where it gives
// them, and its `flips` and `portals` where its world turns over and how many portal clouds it
// carries (cloud-hopper-course.js).
// `courseVersion` changes whenever a level's challenge does, as does that board's registry version.
(() => {
  "use strict";
  const scope = typeof window === "undefined" ? globalThis : window;
  const BL = scope.BL = scope.BL || {};
  const BASE_ROUTE = 430.5 * 0.79, GROWTH = 1.42;
  // Level 5's display name, in one place (its board, `cloud-hopper-l5`, and its migration keep their ids).
  const LEVEL_5_NAME = "Flipside";
  const level = (id, name, sky, slope, layout, timing) => Object.freeze({ id, name, sky: sky && Object.freeze(sky), courseVersion: 1, board: `cloud-hopper-l${id}`,
    route: BASE_ROUTE * GROWTH ** (id - 1), slope, layout: Object.freeze({ sides: 0.55, sideMax: 64, ...layout }), timing: Object.freeze(timing) });
  const LEVELS = Object.freeze([
    // Wider, calmer clouds closer together in drop, gentle turns, most that never fade, longer warnings, and no
    // bounce clouds yet: Level 2 brings them in.
    level(1, "Floating Isles", { hour: 8.25, clouds: 0.36, scenery: "islets" }, 0.5,
      { step: 12, main: [3.1, 1, 2.2, 0.8], side: [3.2, 0.8, 2.4, 0.6], turn: 25, sway: 5, lane: [3, 2], speed: [0.6, 0.4],
        boost: 0.2, bounce: 0, bounceMax: 0, twoPacks: 1 },
      { permanent: 0.8, ordinary: [19.8, 47.4], warn: 3, fade: 1, hidden: [1.5, 3], spine: 1, pace: 3, airJump: false }),
    // The course's own timing (cloud-hopper-course.js's TIMING).
    level(2, "Amber Spires", { hour: 17.45, clouds: 0.42, scenery: "spires" }, 0.47, { step: 11.4, xray: 2 }, {}),
    // Smaller clouds, wider turns and lanes, shorter lives and warnings, less safe ground.
    level(3, "Aurora Heights", { hour: 0.5, clouds: 0, night: true, scenery: "aurora" }, 0.42,
      { step: 12.2, main: [2.3, 0.8, 1.6, 0.6], side: [2.4, 0.6, 1.8, 0.4], turn: 50, sway: 8, lane: [6, 3], speed: [1, 0.7],
        boost: 0.18, bounce: 0.18, xray: 2, updraft: 2, gusts: 2 },
      { permanent: 0.6, ordinary: [15.35, 36.7], warn: 2, fade: 0.75, hidden: [2.5, 4], spine: 4, pace: 3.2 }),
    // The longest climb down, in a storm: today's cloud sizes, wide turns, half its clouds fading, the quickest
    // warnings, haze that hides what lies beyond 160 m, and tornadoes. Its fairness counts on 80% of a running jump
    // rather than 70%, or too few of its clouds could fade fairly.
    level(4, "Thunderhead", { hour: 18.6, clouds: 1, night: true, storm: 0.86, fog: Object.freeze([40, 160]), scenery: "storm", tornado: true }, 0.38,
      { step: 12.5, turn: 50, sway: 8, twoPacks: 1, xray: 3, updraft: 1, hook: 2 },
      { permanent: 0.5, ordinary: [13.9, 33.2], warn: 1.5, fade: 0.625, hidden: [3, 4.5], spine: 4, pace: 3.4, reach: 0.8 }),
    // The storm's eye at sunrise, clear to the eyewall round it, a small step past Thunderhead on every count: the
    // longest route with fewer clouds further apart, smaller and swinging a little wider and faster, more of them
    // fading on shorter lives and warnings, with Thunderhead's tornadoes and a lighter wind than Aurora Heights' (as
    // many gusts, each blowing two seconds for its three and pushing six tenths as hard: `gustBlow`, `gustPush`), since
    // the flip, the fading and the tornadoes carry it. Once a run the whole world turns
    // over, unannounced, at a place seeded with the course in its `flips` stretch round the halfway mark (so, as the
    // course's seed is drawn afresh for every attempt, somewhere else every time), and stays upside down to the
    // finish. It changes nothing of the course, which is one path from start to finish whichever way up the world
    // is. Two gold portal clouds (`portals`), fast and short-lived, each throw a rider about 50 m on. Its fairness
    // counts on 90% of a running jump.
    // A little more height than its first cut (`slope` 0.38 for 0.34) and gentle `terraces`: its drops come in slightly
    // uneven steps, none a plunge.
    level(5, LEVEL_5_NAME, { hour: 6.6, clouds: 0.6, storm: 0.35, scenery: "eye", tornado: true }, 0.38,
      { step: 13.2, main: [2.6, 0.85, 1.8, 0.65], side: [2.7, 0.65, 2, 0.45], turn: 52, sway: 8, lane: [5.3, 3.2], speed: [0.95, 0.65],
        sides: 0.12, boost: 0.27, bounce: 0.22, twoPacks: 1, xray: 3, updraft: 2, hook: 2, gusts: 2, gustBlow: 2, gustPush: 0.6, flips: [[0.4, 0.6]], portals: 2, terraces: 1 },
      { permanent: 0.48, ordinary: [12.8, 30.6], warn: 1.4, fade: 0.6, hidden: [3, 4.5], stagger: 2.5, spine: 4, pace: 3.5, reach: 0.9 })
  ]);
  BL.cloudHopperLevels = { LEVELS, BASE_ROUTE, GROWTH, LEVEL_5_NAME, get: id => LEVELS[id - 1] || null };
})();
