// The island's world on the page (docs/island-world.md): every Ooga nobody drives goes where the island's world puts
// it. Signed in, and offered the `island` game by the Worker, the page follows the server's world (worker/src/games/
// island.js, over game-net.js); otherwise it runs the same world itself (island-sim.js), from this page's own
// contributors. Either way the rows go into one timeline and are drawn `DELAY_MS` behind the newest, eased between
// frames, as the ghost hunt draws its enemies.
//
// A working or chilling Ooga the world shows is followed: its `follow` (where it stands, its heading, what it does and
// the cave it works) is written here before the crew's update, and the crew poses it as it poses its own (crew.js
// `runFollow`), gear and lines and all. Every other Ooga takes the world's state (`worldState`, which crew.js
// `stateOf` reads first), so the page's own crew beds a sleeper and hides the away as it always has; one taken out of
// bed is beamed to its routine (`refreshStates`) before it is followed. Each working Ooga's gorilla is told the cave
// it goes ahead to when that changes (`clankers.plan`).
//
// For now only behind `?islandworld=1`: the room's browser host (npc-sync.js) carries the crew everywhere else, and
// the hub leaves it be while this runs.
(() => {
  "use strict";
  const BL = window.BL;
  const SIM = BL.islandSim, W = BL.gameWire, TIMELINE = BL.gameTimeline;
  const { ACT, STATES } = SIM;
  // A row in the timeline: the Ooga's id, x, z, its heading's cosine and sine, its gorilla's cave plus one, flags.
  const WIDTH = 7, DELAY_MS = 150, DEPTH = 24, LOCAL_DELAY_MS = 2 * SIM.STEP * 1000, ACTIVITY_S = 1, REFRESH_S = 0.5;

  const enabled = () => /(?:^|[?&])islandworld=1(?:&|$)/.test(location.search.slice(1));

  const create = ({ crew, clankers = null, contributors = BL.contributors, platform = null, net = BL.net }) => {
    // The cast the world runs: every roster Ooga but a guest's own likeness, in the crew's order.
    const caves = crew.list.filter((cave) => !cave.avatar), byName = new Map(caves.map((cave) => [cave.traits.name, cave]));
    const n = Math.min(caves.length, W.MAX_ROWS);
    const timeline = TIMELINE.create({ slots: n, width: WIDTH, depth: DEPTH, lerp: [1, 2, 3, 4] });
    const table = new Float64Array(n * WIDTH), shown = new Float64Array(n * WIDTH);
    const slots = new Array(n).fill(null), plans = new Int16Array(n).fill(-1);
    let link = null, sim = null, frame = null, activityIn = 0, live = false, refresh = false, refreshIn = 0;
    const stats = { mode: "", frames: 0, followed: 0 };

    // A frame's rows into the timeline at `t` (ms), in the slots the cast puts them.
    const take = (f, t) => {
      table.fill(0);
      for (let i = 0; i < f.count && i < n; i++) {
        const r = f.rows, k = i * 8, o = i * WIDTH;
        table[o] = r[k + 2]; table[o + 1] = r[k + 3]; table[o + 2] = r[k + 5];
        table[o + 3] = Math.cos(r[k + 6]); table[o + 4] = Math.sin(r[k + 6]); table[o + 5] = r[k + 4]; table[o + 6] = r[k + 7] + 1;
      }
      timeline.push(t, table);
      stats.frames++;
      live = true;
    };
    const cast = (names) => {
      for (let i = 0; i < n; i++) slots[i] = i < names.length ? byName.get(names[i]) || null : null;
      timeline.clear(); live = false;
    };

    if (BL.gameNet && BL.gameNet.offers("island")) {
      stats.mode = "server";
      link = BL.gameNet.open("island", "main", {
        state: (msg) => { if (msg.s && Array.isArray(msg.s.cast)) cast(msg.s.cast); },
        motion: (f) => { if (f.kind === SIM.KIND && slots.some(Boolean)) take(f, f.serverMs); }
      });
    } else {
      stats.mode = "local";
      sim = SIM.create({ seed: (Math.random() * 0x100000000) >>> 0 });
      sim.setCast(caves.slice(0, n).map((cave) => ({ name: cave.traits.name, maintainer: !!cave.traits.maintainer })));
      frame = W.frame();
      cast(caves.slice(0, n).map((cave) => cave.traits.name));
    }
    // A local world's states and caves, as the page's own crew reads them (contributors.js `stateFor`, crew.js
    // `siteActive`, whose caves are the layout's in the same order), once a second.
    const activity = () => {
      const at = Date.now(), sites = crew.workSites || [];
      for (let i = 0; i < n; i++) {
        let mask = 0;
        for (let s = 0; s < sites.length; s++) if (crew.siteActive(caves[i], sites[s])) mask |= 1 << s;
        sim.setActivity(caves[i].traits.name, contributors.stateFor(caves[i].contributor, at), mask);
      }
      if (platform) sim.setPile(platform());
    };

    const unfollow = (cave) => {
      if (cave.follow) { cave.follow = null; cave.followAct = -1; }
    };
    /** Once a frame, before the crew's update: the world's rows into each Ooga's `follow` and `worldState`. */
    const update = (dt) => {
      if (sim) {
        if ((activityIn -= dt) <= 0) { activityIn = ACTIVITY_S; activity(); }
        const before = sim.t;
        sim.step(dt);
        if (sim.t !== before) { sim.motion(frame, 0); take(frame, sim.t * 1000); }
      }
      if (!live) return;
      const at = sim ? sim.t * 1000 - LOCAL_DELAY_MS : link.serverNow() - DELAY_MS;
      if (Number.isNaN(timeline.sample(at, shown))) return;
      let followed = 0;
      for (let i = 0; i < n; i++) {
        const cave = slots[i], o = i * WIDTH;
        if (!cave || !shown[o + 6]) continue;
        const flags = shown[o + 6] - 1, act = flags & 7, state = STATES[flags >> 3 & 3], site = (flags >> 5) - 1;
        const plan = Math.round(shown[o + 5]) - 1;
        if (plan !== plans[i]) { plans[i] = plan; if (plan >= 0 && clankers) clankers.plan(cave, plan); }
        if (cave.worldState !== state) { cave.worldState = state; refresh = true; }
        const shows = act !== ACT.HIDDEN && (state === "working" || state === "chilling");
        if (!shows) { if (cave.follow) { unfollow(cave); refresh = true; } continue; }
        // Out of bed, or another state, first: the crew beams it to its routine, then it is followed.
        if (!cave.follow && (cave.state !== state || cave.bedTravel.mode)) { refresh = true; continue; }
        if (cave.state !== state) { cave.state = state; crew.refreshRosterRow(cave); }
        const f = cave.follow || (cave.follow = { x: 0, z: 0, heading: 0, act: 0, site: -1 });
        f.x = shown[o + 1]; f.z = shown[o + 2]; f.heading = Math.atan2(shown[o + 4], shown[o + 3]); f.act = act; f.site = site;
        cave.root.visible = true;
        followed++;
      }
      stats.followed = followed;
      // At most every REFRESH_S: an Ooga the crew cannot place yet asks again then, not every frame.
      if ((refreshIn -= dt) <= 0 && refresh) { refresh = false; refreshIn = REFRESH_S; crew.refreshStates(true); }
    };
    const dispose = () => {
      if (link) link.close();
      link = sim = null;
      for (const cave of caves) { unfollow(cave); cave.worldState = null; }
      crew.refreshStates(true);
    };
    return { update, dispose, stats, get live() { return live; }, get link() { return link; }, get sim() { return sim; } };
  };

  BL.islandWorld = { enabled, create };
})();
