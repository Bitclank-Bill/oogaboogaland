// Genesis museum: the docents. Museum staff are the island's own apes (agent.js, the same rig as Ooga Arcade's
// crew), in the museum's teal and gold: a docent vest with a name badge and a curator's cap. One looks after the
// front of each gallery and two work the atrium; each strolls round its post, and when a visitor comes near it turns,
// beats its chest in welcome and says a short tip, then lets them be for a while. Nodes and lines are built once;
// update allocates nothing.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const AU = 0.086, SCALE = 0.72, NEAR = 3.4, COOL = 30, RADIUS = 2.4;
  const TEAL = "#1f5e63", TEAL_DK = "#163f43", GOLD = "#e8c35a", CREAM = "#efe6cc", INK = "#2b2421";
  // The vest over the ape's chest (its torso frame, as the arcade's uniform): back and front panels in teal either side
  // of a cream shirt front, gold trim at the hems and up the front, shoulder pads, gold buttons and a name badge.
  const vest = () => {
    const M = BL.models, y0 = 2.6 * AU, y1 = 11.8 * AU, mid = (y0 + y1) / 2, h = y1 - y0, p = [];
    const b = (w, hh, d, x, y, z, color) => p.push(M.box({ w, h: hh, d, color, offset: { x, y, z } }));
    b(10.6 * AU, h, 0.6 * AU, 0, mid, -3.8 * AU, TEAL);
    b(2.4 * AU, h - AU, 0.4 * AU, 0, mid + 0.5 * AU, 3.62 * AU, CREAM);
    for (const s of [-1, 1]) {
      b(4.1 * AU, h, 0.6 * AU, s * 3.25 * AU, mid, 3.8 * AU, TEAL);
      b(0.6 * AU, 7 * AU, 7.6 * AU, s * 5.3 * AU, 6.5 * AU, 0, TEAL_DK);
      b(4 * AU, 0.9 * AU, 6.4 * AU, s * 5.6 * AU, 13.45 * AU, -0.3 * AU, TEAL);
      b(0.55 * AU, h, 0.7 * AU, s * 1.45 * AU, mid, 3.85 * AU, GOLD);
      b(4.1 * AU, 0.6 * AU, 0.7 * AU, s * 3.25 * AU, y0 + 0.3 * AU, 3.85 * AU, GOLD);
    }
    b(10.8 * AU, 0.6 * AU, 0.7 * AU, 0, y0 + 0.3 * AU, -3.85 * AU, GOLD);
    for (const y of [5.2, 7.2, 9.2]) b(0.6 * AU, 0.6 * AU, 0.4 * AU, 2.05 * AU, y * AU, 4.15 * AU, GOLD);
    b(2.2 * AU, 1.2 * AU, 0.3 * AU, -3.2 * AU, 9.4 * AU, 4.2 * AU, CREAM);
    b(1.7 * AU, 0.26 * AU, 0.1 * AU, -3.2 * AU, 9.7 * AU, 4.38 * AU, TEAL);
    b(1.2 * AU, 0.2 * AU, 0.1 * AU, -3.2 * AU, 9.25 * AU, 4.38 * AU, INK);
    return M.merge(...p);
  };
  // The curator's cap on the head (its frame, as the arcade's hats): a teal crown, a gold band and a short dark peak.
  const cap = () => {
    const M = BL.models;
    return M.merge(M.lathe({ profile: [[0.3, 0.6], [0.305, 0.76], [0.26, 0.82], [0, 0.83]], segments: 14, color: TEAL }),
      M.lathe({ profile: [[0.307, 0.6], [0.31, 0.66], [0.3, 0.66]], segments: 14, color: GOLD }),
      M.box({ w: 0.42, h: 0.03, d: 0.22, color: TEAL_DK, offset: { x: 0, y: 0.61, z: 0.36 } }),
      M.box({ w: 0.1, h: 0.08, d: 0.02, color: GOLD, emissive: 0.4, offset: { x: 0, y: 0.68, z: 0.31 } }));
  };
  // What a docent says: at the atrium, how the museum works; at a gallery, its era first, then a tip.
  const ATRIUM_LINES = [
    "Welcome to the Genesis Hall! Hop on the moving walkway: it runs through the eras in date order.",
    "Every gallery is one era. Ride its walkway in, and the stage at the end has a show now and then.",
    "Press G, or tap the white screen, for every invention on one timeline.",
    "Follow the gold path: those are the steps toward Bitcoin, in date order.",
    "E by any exhibit, or a click on it, opens its workbench. Try the machines, they really work!"
  ];
  const TIPS = [
    "E by an exhibit, or a click on it, opens its workbench.",
    "The headlines on the back wall are real ones from these years.",
    "Wait by the stage at the end: the players come out now and then.",
    "Gold numbers on the floor are steps toward Bitcoin.",
    "Ride the out walkway back to the courtyard."
  ];
  // `guide[n]`, optional: what era n's docent points out ({ steps: [titles of its steps toward Bitcoin], game: title }).
  const create = ({ eras, museum, lane, entry, root, footing, fx, addChild, createNode, guide = [] }) => {
    const posts = [], p = { x: 0, z: 0 };
    // A gallery's docent: by its opening, to the side of its walk away from its overview board.
    for (const e of eras) {
      museum.toMuseum(e.n, lane + 4, e.z1 - 3.5, p);
      const g = guide[e.n] || {}, own = [];
      if (g.steps && g.steps.length) own.push(g.steps.length === 1 ? `Find the gold step here: ${g.steps[0]}. It led toward Bitcoin.` : `${g.steps.length} gold steps toward Bitcoin are in here, starting with ${g.steps[0]}.`);
      if (g.game) own.push(`Ride the walkway to the end: the cabinet there plays ${g.game}.`);
      posts.push({ x: p.x, z: p.z, r: RADIUS, era: e, lines: [`Welcome to Era ${e.n}: ${e.name}, ${e.years}.`, ...own, ...TIPS] });
    }
    // Two in the atrium: one beside the arrival, one by the statue.
    posts.push({ x: entry.x + 5, z: entry.z - 3, r: 3, era: null, lines: ATRIUM_LINES }, { x: -9, z: 3, r: 3, era: null, lines: ATRIUM_LINES.slice(1).concat(ATRIUM_LINES[0]) });
    // Each docent as a body the visitor's Ooga meets (crew.js outsideActors): its feet, height and a shoulder radius.
    const vestGeo = vest(), capGeo = cap(), staff = [], bodies = [];
    for (const post of posts) {
      const d = { post, agent: null, cool: Math.random() * 6, line: 0, greet: 0, face: 0 };
      d.agent = BL.agent.create({
        groundAt: (x, z) => footing.supportAt(x, z, d.agent ? d.agent.root.position.y + 0.5 : 2),
        walkable: (ax, az, bx, bz, feet) => footing.walkable(ax, az, bx, bz, 0.35, feet) && Math.hypot(bx - post.x, bz - post.z) <= post.r + 0.5,
        form: "ape", x: post.x, z: post.z, heading: Math.random() * Math.PI * 2, scale: SCALE
      });
      addChild(d.agent.parts.torso, createNode({ geometry: vestGeo }));
      addChild(d.agent.parts.head, createNode({ geometry: capGeo }));
      d.agent.pace(post.x, post.z, post.r);
      addChild(root, d.agent.root);
      staff.push(d);
      bodies.push(d.body = { x: post.x, z: post.z, y: 0, height: 1.4, radius: 0.42 });
    }
    // Each frame: stroll, or, when the visitor (at vx, vz; null when nobody walks) comes near and the docent is free,
    // turn to them, beat the chest and say the next line.
    const update = (dt, vx, vz) => {
      for (const d of staff) {
        const a = d.agent, q = a.root.position;
        d.cool = Math.max(0, d.cool - dt);
        if (vx !== null && d.cool === 0 && (q.x - vx) * (q.x - vx) + (q.z - vz) * (q.z - vz) < NEAR * NEAR) {
          d.cool = COOL; d.greet = 2.2; d.face = Math.atan2(vx - q.x, vz - q.z);
          a.place(q.x, q.z, a.heading);
          fx.sayAt(q.x, q.y + 1.9, q.z, d.post.lines[d.line++ % d.post.lines.length], 4.5);
        }
        if (d.greet > 0) {
          d.greet -= dt;
          const turn = Math.atan2(Math.sin(d.face - a.heading), Math.cos(d.face - a.heading));
          if (Math.abs(turn) > 0.004) a.place(q.x, q.z, a.heading + turn * (1 - Math.exp(-7 * dt)));
          a.setGait(d.greet > 0.6 ? "beat" : "idle");
          if (d.greet <= 0) a.pace(d.post.x, d.post.z, d.post.r);
        }
        a.update(dt);
        d.body.x = q.x; d.body.z = q.z; d.body.y = q.y;
      }
    };
    const liveGeometry = (set) => { for (const d of staff) d.agent.liveGeometry(set); };
    const dispose = () => { for (const d of staff) d.agent.dispose(); staff.length = 0; bodies.length = 0; };
    return { update, liveGeometry, dispose, staff, posts, bodies };
  };
  BL.genesisDocents = { create, ATRIUM_LINES, TIPS, RADIUS, NEAR };
})();
