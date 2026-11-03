// Genesis museum: a map of Ooga Booga Land on a slanted table by the statue. The island seen from above, painted once a
// page: its caves where caves.js puts them (by the clock, from the north), the banana pile in the middle, the vine
// bridge out to the Mempool island, ₿IFRÖST's islet past the north pass and the Timechain Sphere off the southwest rim.
// Space beside it (or a tap) opens a few lines on each place. Nothing here moves.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const W = 640, H = 480;
  // The places off the island itself: where they stand (a clock bearing, a distance from the middle as a share of the
  // island's radius) and how they are drawn.
  const AWAY = [
    { name: "Mempool island", clock: 4, r: 1.42, kind: "isle", line: "A rainforest round a lake as deep as the waiting transactions, reached by the vine bridge at 4 o'clock." },
    { name: "₿IFRÖST", clock: 12, r: 1.4, kind: "arch", line: "A gateway islet past the arch over the north pass: windows to other worlds." },
    { name: "Timechain Sphere", clock: 7.6, r: 1.32, kind: "sphere", line: "A walk-in sphere off the southwest rim: nine rooms of live block and mining charts." }
  ];
  const pt = (cx, cy, r, clock) => { const a = clock / 12 * Math.PI * 2; return [cx + Math.sin(a) * r, cy - Math.cos(a) * r]; };
  const paint = (canvas) => {
    const g = canvas.getContext("2d"), cx = W / 2, cy = H / 2 + 10, R = 150;
    canvas.width = W; canvas.height = H;
    const sea = g.createRadialGradient(cx, cy, R * 0.6, cx, cy, W * 0.7);
    sea.addColorStop(0, "#2f86b8"); sea.addColorStop(1, "#163f63");
    g.fillStyle = sea; g.fillRect(0, 0, W, H);
    // The places away from the island, under it, with their links.
    for (const p of AWAY) {
      const [x, y] = pt(cx, cy, R * p.r, p.clock), [bx, by] = pt(cx, cy, R * 0.98, p.clock);
      g.strokeStyle = p.kind === "isle" ? "#8a5a2c" : "#d9c7a0"; g.lineWidth = 4; g.setLineDash(p.kind === "isle" ? [6, 4] : []);
      g.beginPath(); g.moveTo(bx, by); g.lineTo(x, y); g.stroke(); g.setLineDash([]);
      if (p.kind === "isle") { g.fillStyle = "#3f7a2c"; g.beginPath(); g.arc(x, y, 34, 0, 7); g.fill(); g.fillStyle = "#5ec8ff"; g.beginPath(); g.arc(x, y, 14, 0, 7); g.fill(); }
      else if (p.kind === "arch") { g.fillStyle = "#6f8f3a"; g.beginPath(); g.arc(x, y, 20, 0, 7); g.fill(); g.strokeStyle = "#b98cff"; g.lineWidth = 5; g.beginPath(); g.arc(x, y + 6, 12, Math.PI, 0); g.stroke(); }
      else { g.fillStyle = "#1b1d24"; g.beginPath(); g.arc(x, y, 18, 0, 7); g.fill(); g.strokeStyle = "#f7931a"; g.lineWidth = 3; g.beginPath(); g.arc(x, y, 18, 0, 7); g.stroke(); }
    }
    // The island: a sandy rim, the meadow, paths to the caves.
    g.fillStyle = "#d9c08a"; g.beginPath(); g.arc(cx, cy, R + 8, 0, 7); g.fill();
    g.fillStyle = "#5c9a3a"; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fill();
    g.strokeStyle = "#b8955a"; g.lineWidth = 5;
    const caves = (BL.caves && BL.caves.slots || []).filter((c) => c.name);
    for (const c of caves) { const [x, y] = pt(cx, cy, R * 0.86, c.clock); g.beginPath(); g.moveTo(cx, cy); g.lineTo(x, y); g.stroke(); }
    g.beginPath(); g.arc(cx, cy, R * 0.45, 0, 7); g.stroke();
    // The banana pile and the jumbotron in the middle.
    g.fillStyle = "#ffd23a"; g.beginPath(); g.arc(cx, cy, 16, 0, 7); g.fill();
    g.fillStyle = "#1b1d24"; g.fillRect(cx - 22, cy - 46, 44, 14);
    // The caves on the rim, a dot each in their colour, and their names.
    g.font = "bold 15px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    const ink = { lab: "#7affd8", bca: "#e8c35a", lightning: "#5ec8ff", arcade: "#ff5fa2", matrix: "#9cff9c" };
    for (const c of caves) {
      const [x, y] = pt(cx, cy, R * 0.9, c.clock), [lx, ly] = pt(cx, cy, R * 1.0 + 34, c.clock);
      g.fillStyle = ink[c.theme] || "#efe6cc"; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill();
      g.fillStyle = "rgba(10,10,12,0.72)"; const tw = g.measureText(c.name).width + 10; g.fillRect(lx - tw / 2, ly - 10, tw, 20);
      g.fillStyle = "#f6ecd2"; g.fillText(c.name, lx, ly);
    }
    for (const p of AWAY) {
      const [x, y] = pt(cx, cy, R * p.r + 34, p.clock);
      g.fillStyle = "rgba(10,10,12,0.72)"; const tw = g.measureText(p.name).width + 10; g.fillRect(x - tw / 2, y - 10, tw, 20);
      g.fillStyle = "#ffe08a"; g.fillText(p.name, x, y);
    }
    // The title and the north mark.
    g.fillStyle = "rgba(10,10,12,0.75)"; g.fillRect(0, 0, W, 34);
    g.font = "bold 20px sans-serif"; g.fillStyle = "#ffd23a"; g.fillText("OOGA BOOGA LAND", cx, 18);
    g.font = "bold 14px sans-serif"; g.fillStyle = "#f6ecd2"; g.fillText("N", W - 26, 52); g.beginPath(); g.moveTo(W - 26, 60); g.lineTo(W - 32, 76); g.lineTo(W - 20, 76); g.closePath(); g.fill();
    g.strokeStyle = "#3b2a1a"; g.lineWidth = 10; g.strokeRect(5, 5, W - 10, H - 10);
  };
  // The guide's pages: the island's places, a line each.
  const pages = () => {
    const caves = (BL.caves && BL.caves.slots || []).filter((c) => c.name && c.status !== "headquarters");
    const lines = caves.map((c) => `${c.name} (${c.clock > 12 ? c.clock - 12 : Math.round(c.clock)} o'clock): ${c.title || (c.status === "mirror" ? "the cave behind the Matrix mirror" : "a cave on the island's rim")}`);
    return [
      { caption: "Ooga Booga Land", title: "The island", text: ["A floating island whose cliff caves are projects; the banana pile in the middle feeds the Oogas.", ...lines] },
      { caption: "Ooga Booga Land", title: "Beyond the rim", text: AWAY.map((p) => `${p.name}: ${p.line}`) }
    ];
  };
  // The table: a timber stand with a slanted top; the map lies on the top, its picture `asset`.
  const build = ({ M, createNode, addChild, place, top, at }) => {
    const canvas = document.createElement("canvas");
    paint(canvas);
    const image = new Image(); image.src = canvas.toDataURL("image/png");
    const w = 2.4, h = 1.8;
    const face = { verts: [-w / 2, -h / 2, 0.03, w / 2, -h / 2, 0.03, w / 2, h / 2, 0.03, -w / 2, h / 2, 0.03], faces: [{ i: [0, 1, 2, 3], color: [0, 0, 0], emissive: 0 }], lines: [], castShadow: false };
    face.imageSurface = { asset: { width: W, height: H, load: () => image }, rect: [-w / 2, -h / 2, w, h] };
    const root = place(createNode({ position: { x: at.x, y: top, z: at.z }, rotation: { x: 0, y: at.ry || 0, z: 0 } }));
    addChild(root, createNode({ geometry: M.merge(
      M.box({ w: 0.25, h: 0.9, d: 0.25, color: "#4c331d", offset: { x: 0, y: 0.45, z: 0 } }),
      M.box({ w: 1.2, h: 0.08, d: 0.8, color: "#3b2a1a", offset: { x: 0, y: 0.04, z: 0 } })) }));
    const slab = createNode({ position: { x: 0, y: 1.05, z: 0 }, rotation: { x: -1.05, y: 0, z: 0 } });
    addChild(slab, createNode({ geometry: M.box({ w: w + 0.2, h: h + 0.2, d: 0.06, color: "#5a3a22" }) }), createNode({ geometry: face }));
    addChild(root, slab);
    return { root, footprint: { w: 2.6, d: 1.6 } };
  };
  BL.genesisMinimap = { paint, pages, build, AWAY };
})();
