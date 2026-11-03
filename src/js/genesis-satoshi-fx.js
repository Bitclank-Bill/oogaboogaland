// Genesis museum: the light round the Satoshi bust. A gold halo turning slowly round its plinth, gold sparkles
// drifting up around it, and one of Satoshi Nakamoto's own lines at a time on a card circling the statue, each with
// where and when it was written (checked against the archived originals: the paper, the Cryptography mailing list,
// the P2P Foundation forum and BitcoinTalk). Nodes are built once; update allocates nothing. Calm stills the motion.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const QUOTES = [
    ["“I've been working on a new electronic cash system that's fully peer-to-peer, with no trusted third party.”", "Satoshi Nakamoto · Cryptography mailing list · 31 October 2008"],
    ["“What is needed is an electronic payment system based on cryptographic proof instead of trust.”", "Bitcoin: A Peer-to-Peer Electronic Cash System · 2008"],
    ["“The Times 03/Jan/2009 Chancellor on brink of second bailout for banks”", "written into the genesis block · 3 January 2009"],
    ["“It might make sense just to get some in case it catches on.”", "Satoshi Nakamoto · Cryptography mailing list · January 2009"],
    ["“The root problem with conventional currency is all the trust that's required to make it work.”", "Satoshi Nakamoto · P2P Foundation forum · February 2009"],
    ["“Lost coins only make everyone else's coins worth slightly more. Think of it as a donation to everyone.”", "Satoshi Nakamoto · BitcoinTalk · 21 June 2010"]
  ];
  const MOTES = 28, QUOTE_S = 9, ORBIT_R = 4.6, ORBIT_Y = 5.4, HOLD_S = 0.5;
  // A quote's card: the line split into short rows under one board (the factory's label takes "\n" rows), its source
  // under them.
  const wrap = (text, width) => {
    const words = text.split(" "), rows = [];
    let row = "";
    for (const w of words) { if ((row + " " + w).trim().length > width && row) { rows.push(row); row = w; } else row = (row + " " + w).trim(); }
    if (row) rows.push(row);
    return rows.join("\n");
  };
  const build = ({ M, createNode, addChild, place, label, top, at }) => {
    const root = place(createNode({ position: { x: at.x, y: top, z: at.z } }));
    // The halo: a thin gold ring a little over the plinth's top step, and a fainter one above it.
    const halo = createNode({ geometry: M.turnedX(M.torus(2.75, 0.05, "#ffd27a", 1.6), Math.PI / 2), position: { x: 0, y: 1.62, z: 0 } });
    const halo2 = createNode({ geometry: M.turnedX(M.torus(2.95, 0.03, "#fff0b0", 1.2), Math.PI / 2), position: { x: 0, y: 1.78, z: 0 } });
    addChild(root, halo, halo2);
    // The sparkles: one tiny glowing cube each, rising round the bust and starting again at the bottom.
    const mote = M.box({ w: 0.07, h: 0.07, d: 0.07, color: "#ffe08a", emissive: 2.2 }), motes = [];
    for (let i = 0; i < MOTES; i++) {
      const n = createNode({ geometry: mote });
      addChild(root, n);
      motes.push({ n, a: i / MOTES * Math.PI * 2, r: 2.2 + (i * 37 % 11) / 11 * 1.4, y: (i * 53 % 17) / 17 * 8, v: 0.35 + (i * 29 % 7) / 14 });
    }
    // The quote cards, built once, one shown at a time, circling the statue and turned to face outward.
    const cards = QUOTES.map(([q, src]) => {
      const l = label(wrap(q, 34), src, { height: 1.15, style: "gold" }), n = createNode({ visible: false });
      addChild(n, createNode({ geometry: l.back }), createNode({ geometry: l.face }));
      addChild(root, n);
      return n;
    });
    const st = { t: 0, quote: 0, qt: 0, orbit: 0 };
    const update = (dt, calm) => {
      st.t += dt;
      if (!calm) { halo.rotation.y += dt * 0.4; halo2.rotation.y -= dt * 0.25; }
      halo.glow = 1.2 + Math.sin(st.t * 1.7) * 0.3; halo2.glow = 0.9 + Math.sin(st.t * 1.3 + 1) * 0.3;
      for (const m of motes) {
        if (!calm) { m.y += m.v * dt; m.a += dt * 0.15; }
        if (m.y > 9) m.y -= 9;
        m.n.position.x = Math.sin(m.a) * m.r; m.n.position.z = Math.cos(m.a) * m.r; m.n.position.y = 1.6 + m.y;
        m.n.glow = 0.6 + Math.sin(st.t * 3 + m.a * 5) * 0.5 + (1 - m.y / 9) * 0.6;
      }
      // The quote: pops up, holds, pops down, the next comes; the card drifts round the statue, facing out.
      st.qt += dt;
      if (st.qt >= QUOTE_S) { cards[st.quote].visible = false; st.quote = (st.quote + 1) % cards.length; st.qt = 0; }
      if (!calm) st.orbit += dt * 0.12;
      const c = cards[st.quote], k = Math.min(1, st.qt / HOLD_S, (QUOTE_S - st.qt) / HOLD_S), s = Math.max(0.001, k);
      c.visible = true;
      c.position.x = Math.sin(st.orbit) * ORBIT_R; c.position.z = Math.cos(st.orbit) * ORBIT_R; c.position.y = ORBIT_Y + Math.sin(st.t * 0.8) * 0.15;
      c.rotation.y = st.orbit;
      c.scale.x = c.scale.y = c.scale.z = s;
    };
    return { root, update, quotes: QUOTES.length };
  };
  BL.genesisSatoshiFx = { build, QUOTES, wrap };
})();
