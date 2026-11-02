// Genesis museum: period photographs on the galleries' side walls. They are museum illustrations, painted here in
// the look of each era's photographs (black and white, faded colour, flash snapshots, early digital), of everyday
// scenes of its years with Oogas in them: never real photographs, real people or anyone's work, and each frame's
// caption says so. Six pictures an era, painted once a page (seeded) and shared by every frame that shows them.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const W = 320, H = 240;
  // Each era's look: paper, shadow and light inks and how much grain and fade, then its six scenes.
  const LOOKS = [
    { ink: ["#1b1b1b", "#5c5c5c", "#b9b9b9", "#ecebe6"], grain: 0.16, border: "#f3efe6" },
    { ink: ["#3a2618", "#9a5a2e", "#d9a35c", "#f3dfb4"], grain: 0.12, border: "#f4ead6" },
    { ink: ["#20193a", "#c2386e", "#f2a03d", "#fbe6a8"], grain: 0.1, border: "#f6f1e8" },
    { ink: ["#13303a", "#2f7a7a", "#e2c86a", "#f4f0de"], grain: 0.08, border: "#f6f6f2" },
    { ink: ["#0f1a2c", "#3d5f9a", "#9fc3e8", "#eef4fb"], grain: 0.06, border: "#fbfbfb" },
    { ink: ["#151a22", "#4d6a8a", "#9cd2ff", "#f2f8ff"], grain: 0.04, border: "#ffffff" },
    { ink: ["#1c1a18", "#6e5a40", "#d8b880", "#fbf5ea"], grain: 0.03, border: "#ffffff" },
    { ink: ["#0b1220", "#2a3d5c", "#f7931a", "#eef3f8"], grain: 0.03, border: "#ffffff" }
  ];
  const SCENES = [
    ["machines", "A computer room, its tape drives spinning", "office", "Punch cards stacked for the night's run", "street", "A city street of the early 1960s",
      "home", "Gathered round the family wireless", "lab", "A lab bench of valves and wire", "crowd", "A science fair queue"],
    ["home", "The living room: TV, rug and a lava lamp", "office", "A terminal on a shared line", "street", "Station wagons in the car park",
      "lab", "Wiring a first network link", "crowd", "A packed computing conference", "machines", "Minicomputers in a row"],
    ["crowd", "Friday night at the arcade", "home", "A first home computer by the TV", "street", "Neon on the high street",
      "office", "Floppy disks and a green screen", "machines", "A rack of modems", "lab", "Soldering a homebrew board"],
    ["office", "A beige office of the early web", "home", "A brick phone on the kitchen table", "crowd", "A computer club meeting",
      "street", "Pagers, payphones and a bus stop", "machines", "Servers under a desk", "lab", "Burning a CD at midnight"],
    ["office", "A dial-up evening: wait for the modem", "home", "The family computer and its CRT", "crowd", "A trade show stand",
      "machines", "A rack of early web servers", "street", "An internet cafe opens", "lab", "Writing mail on a mailing list"],
    ["home", "Music on a pocket player", "office", "A flat screen arrives at work", "crowd", "A LAN party in a basement",
      "street", "Flip phones at the station", "machines", "A home router, lights blinking", "lab", "Sharing files with friends"],
    ["office", "A laptop in a cafe, 2007", "street", "Queues outside a bank, 2008", "home", "The evening news on the crisis",
      "crowd", "A cryptography meetup", "machines", "A mailing list scrolls", "lab", "Reading a nine-page paper"],
    ["home", "A cold January night, 2009", "office", "A small screen's first block", "street", "Snow on the city",
      "machines", "A desktop mining by itself", "crowd", "A few readers on a forum", "lab", "The first transactions"]
  ];
  const rng = (seed) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  // A chunky Ooga silhouette standing at (x, y) (its feet), h tall.
  const ooga = (g, x, y, h, ink) => {
    g.fillStyle = ink;
    g.fillRect(x - h * 0.17, y - h * 0.62, h * 0.34, h * 0.4); g.fillRect(x - h * 0.13, y - h * 0.86, h * 0.26, h * 0.25);
    g.fillRect(x - h * 0.16, y - h * 0.9, h * 0.32, h * 0.08); g.fillRect(x - h * 0.13, y - h * 0.24, h * 0.1, h * 0.24); g.fillRect(x + h * 0.03, y - h * 0.24, h * 0.1, h * 0.24);
    g.fillRect(x - h * 0.27, y - h * 0.6, h * 0.1, h * 0.3); g.fillRect(x + h * 0.17, y - h * 0.6, h * 0.1, h * 0.3);
  };
  const paint = (canvas, n, k) => {
    const g = canvas.getContext("2d"), L = LOOKS[n], [ink0, ink1, ink2, ink3] = L.ink, kind = SCENES[n][k * 2], rand = rng(1009 + n * 97 + k * 13);
    canvas.width = W; canvas.height = H;
    // The scene: a wall or sky, a floor or street, then its things and its Oogas.
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, kind === "street" ? ink2 : ink1); sky.addColorStop(1, kind === "street" ? ink3 : ink2);
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    const floor = H * (0.62 + rand() * 0.08);
    g.fillStyle = ink1; g.fillRect(0, floor, W, H - floor);
    if (kind === "machines") for (let i = 0; i < 6; i++) { const x = 14 + i * 50; g.fillStyle = ink3; g.fillRect(x, floor - 96, 40, 96); g.fillStyle = ink0; g.beginPath(); g.arc(x + 12, floor - 70, 8, 0, 7); g.arc(x + 28, floor - 70, 8, 0, 7); g.fill(); g.fillRect(x + 6, floor - 40, 28, 4); }
    else if (kind === "office") { g.fillStyle = ink0; g.fillRect(40, floor - 40, 180, 8); g.fillRect(50, floor - 32, 8, 32); g.fillRect(200, floor - 32, 8, 32); g.fillStyle = ink3; g.fillRect(90, floor - 96, 80, 56); g.fillStyle = ink2; g.fillRect(98, floor - 90, 64, 42); }
    else if (kind === "street") { for (let i = 0; i < 5; i++) { const w = 50 + rand() * 30, h = 70 + rand() * 90, x = i * 66 - 6; g.fillStyle = i % 2 ? ink1 : ink0; g.fillRect(x, floor - h, w, h); g.fillStyle = ink3; for (let r = 0; r < h / 22 - 1; r++) for (let c = 0; c < w / 16 - 1; c++) if (rand() < 0.6) g.fillRect(x + 6 + c * 16, floor - h + 8 + r * 22, 7, 10); }
      g.fillStyle = ink0; g.fillRect(170, floor + 6, 110, 26); g.fillRect(190, floor - 12, 64, 20); g.fillStyle = ink2; g.beginPath(); g.arc(192, floor + 34, 9, 0, 7); g.arc(258, floor + 34, 9, 0, 7); g.fill(); }
    else if (kind === "home") { g.fillStyle = ink0; g.fillRect(30, floor - 70, 90, 70); g.fillStyle = ink3; g.fillRect(40, floor - 62, 70, 48); g.fillStyle = ink2; g.fillRect(160, floor - 36, 130, 36); g.fillRect(160, floor - 60, 22, 60); g.fillStyle = ink3; g.fillRect(250, 30, 40, 54); }
    else if (kind === "lab") { g.fillStyle = ink0; g.fillRect(20, floor - 44, 280, 10); for (let i = 0; i < 7; i++) { g.fillStyle = i % 2 ? ink3 : ink2; g.fillRect(34 + i * 38, floor - 44 - 14 - rand() * 30, 18, 14 + rand() * 30); } g.strokeStyle = ink3; g.lineWidth = 2; g.beginPath(); for (let i = 0; i < 8; i++) { g.moveTo(30 + i * 34, floor - 44); g.quadraticCurveTo(50 + i * 34, floor - 10, 70 + i * 30, floor - 44); } g.stroke(); }
    else { g.fillStyle = ink3; g.fillRect(60, 30, 200, 60); g.fillStyle = ink0; g.font = "bold 22px sans-serif"; g.textAlign = "center"; g.fillText(n === 2 ? "ARCADE" : "WELCOME", 160, 68); }
    // The Oogas in it: one to five, near and far.
    const count = kind === "crowd" ? 7 : 1 + Math.floor(rand() * 3);
    for (let i = 0; i < count; i++) { const far = rand(), h = 60 + (1 - far) * 70; ooga(g, 30 + rand() * (W - 60), floor + (1 - far) * 30, h, far > 0.5 ? ink1 : ink0); }
    // The print: grain, a fade toward the corners and a white border.
    const img = g.getImageData(0, 0, W, H), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const e = (rand() - 0.5) * 255 * L.grain; d[i] += e; d[i + 1] += e; d[i + 2] += e; }
    g.putImageData(img, 0, 0);
    const v = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.7);
    v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.45)");
    g.fillStyle = v; g.fillRect(0, 0, W, H);
    g.strokeStyle = L.border; g.lineWidth = 12; g.strokeRect(6, 6, W - 12, H - 12);
  };
  // The pictures an era shows, painted on first use (a page's document only; Node checks the tables alone).
  const cache = new Map();
  const picture = (n, k) => {
    const key = n * 8 + k;
    let p = cache.get(key);
    if (!p) {
      const canvas = document.createElement("canvas");
      paint(canvas, n, k);
      const image = new Image(); image.src = canvas.toDataURL("image/png");
      p = { asset: { width: W, height: H, load: () => image }, caption: SCENES[n][k * 2 + 1] };
      cache.set(key, p);
    }
    return p;
  };
  // Where an era's photographs hang (its own coordinates): on both side walls, between its glowing motifs, centre
  // AT_Y over the floor, a picture every 7 m along each wall, clear of the arch and the back wall.
  const AT_Y = 4.4, PW = 1.8, PH = 1.35;
  const spots = (bay, z0, z1) => {
    const out = [], len = z1 - z0, mid = (z0 + z1) / 2;
    let k = 0;
    for (const side of [-1, 1]) for (let a = -len / 2 + 7; a < len / 2 - 2; a += 7) {
      out.push({ x: side < 0 ? bay.x0 + 0.22 : bay.x1 - 0.22, z: side < 0 ? mid - a : mid + a, ry: side < 0 ? Math.PI / 2 : -Math.PI / 2, k: k++ % 6 });
    }
    return out;
  };
  BL.genesisPhotos = { LOOKS, SCENES, spots, picture, paint, AT_Y, PW, PH };
})();
