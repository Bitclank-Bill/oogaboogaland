// Room 7, the Mining Museum: how the work moved from hobby desktops to warehouses, and why today's hardware does
// about a million times more hashes per joule than in 2009. The dome is seventeen years of network hashrate on a log
// scale wrapped round the room, from 2009 by the door on the left to today on the right, shaded by era (CPU, GPU,
// FPGA, ASIC) right over that era's exhibits, the hash units labelled over the door where the chart starts and ends;
// the crown spells today's rate out, live from mempool.space when it can read it. Eleven exhibits stand round a ring
// in date order, each a model (1.6 times life size) on a plinth with its plaque; a tap, or Space in front of one,
// opens it in the model viewer (`model-viewer.js`), up close in 3D beside all its stats and sources. Satoshi's
// machine is the one Sergio Demian Lerner's Patoshi research points to: a single high-end 2009 desktop, its CPU
// sweeping five nonce ranges at once. A big S21 turns slowly on a plinth in the middle.
(() => {
  "use strict";
  const BL = window.BL;
  const RM = BL.timechainRoomModels, CH = BL.timechainCharts, ROOMS = BL.timechainRooms, P = RM.paintKit;
  const { box, merge } = BL.models;
  const { own } = RM.helpers;
  const C = {
    amber: "#f7931a", amberText: "#ffb04d", white: "#f4efe6", grey: "#a89c8b", ink: "#14110e", stone: "#d8d0c2", post: "#3a3530",
    alu: "#b8bec6", dark: "#1c1e22", beige: "#cfc6b0", pcb: "#1f6b3a", chip: "#111111", fanPlate: "#2a2d32", fanHole: "#0d0e10",
    blade: "#41454c", hub: "#7a8089", led: "#3ce07a", cable: "#1d6fd6", label: "#e8e8ea"
  };

  // ---------- what the museum says (checked against Sergio Demian Lerner's research for Satoshi's machine, the Bitcoin
  // Wiki's hardware tables, the makers' specifications and mempool.space's hashrate history) ----------
  // Each exhibit: its year (placing it on the ring and the dome), the plaque's title, name, line and three stats, its
  // joules a terahash for the plaque's efficiency scale (none for the pool, which is an idea, not a machine), and for
  // the viewer a longer account (`about`), all its stats (`specs`), a note and its sources.
  const SRC = {
    lerner: { href: "https://bitslog.com/2020/08/22/the-patoshi-mining-machine/", label: "Lerner · The Patoshi Mining Machine (2020)" },
    deniers: { href: "https://bitslog.com/2019/04/16/the-return-of-the-deniers-and-the-revenge-of-patoshi/", label: "Lerner · The Revenge of Patoshi (2019)" },
    gpu: { href: "https://en.bitcoin.it/wiki/Non-specialized_hardware_comparison", label: "Bitcoin Wiki · non-specialized hardware" },
    hw: { href: "https://en.bitcoin.it/wiki/Mining_hardware_comparison", label: "Bitcoin Wiki · mining hardware" },
    avalon: { href: "https://en.bitcoin.it/wiki/Avalon1", label: "Bitcoin Wiki · Avalon1" },
    s21: { href: "https://support.bitmain.com/hc/en-us/articles/23794895251609-S21-Specification", label: "Bitmain · S21 specification" },
    xp: { href: "https://support.bitmain.com/hc/en-us/articles/34523540504857-S21-XP-Hyd-Specification", label: "Bitmain · S21 XP Hyd specification" },
    hashrate: { href: "https://mempool.space/graphs/mining/hashrate-difficulty", label: "mempool.space · network hashrate" }
  };
  const MINERS = [
    { year: 2009.1, title: "CPU", name: "Satoshi's computer", model: "cpu", jth: 2e7,
      text: "One high-end 2009 CPU, five threads at once: the first blocks as Sergio Demian Lerner reads them.",
      stats: [["Hashrate", "~7-20 MH/s"], ["Power", "~200 W"], ["J/TH", "~10-29 million"]],
      about: "Sergio Demian Lerner found the Patoshi pattern in the earliest blocks, the miner most think was Satoshi. In 2020 he showed it swept five nonce ranges in parallel, each in order, rarely touching the timestamp: multi-threading on one machine, not some fifty PCs. A single high-end desktop or server of 2009 running a tuned miner could have mined every Patoshi block, and his own test CPU runs about as fast as the Intel Core i7-965 Extreme, 2009's fastest desktop chip. He links Patoshi to Satoshi by evidence, not proof.",
      specs: [["Processor", "Intel Core i7-965 Extreme class (Nehalem, 45 nm)"], ["Cores", "4 cores, 8 threads, 3.2 GHz"], ["Mining", "5 threads, each sweeping its own fifth of the nonces"], ["Hashrate", "~7 MH/s plain, ~20 MH/s with 4-way SSE2"], ["Lerner's test", "a difficulty-1 block every 619 s, 219 s with SSE2"], ["CPU power", "130 W (TDP); the PC ~200 W"], ["Network, 2009", "about 5 MH/s in all"], ["Machines", "one, by Lerner's reading"]],
      note: "Hashrates worked out from Lerner's benchmark times, at 2^32 hashes a difficulty-1 block. The model is a high-end 2009 desktop running Bitcoin 0.1.", sources: [SRC.lerner, SRC.deniers, SRC.hashrate] },
    { year: 2010.6, title: "GPU", name: "Radeon HD 5870 rig", model: "gpu", jth: 4.7e5,
      text: "Graphics cards took over in 2010. Tuned, one Radeon HD 5870 hashed about 400 MH/s.",
      stats: [["Per card", "~400 MH/s"], ["Power", "188 W"], ["J/TH", "~470,000"]],
      about: "OpenCL miners in 2010 put SHA-256 on a graphics card's 1,600 simple cores. Rigs of four or more cards on an open frame, fed by riser cables, outhashed the whole 2009 network hundreds of times over, and mining moved from the desktop to the spare room.",
      specs: [["Card", "ATI Radeon HD 5870 (Cypress, 40 nm, 2009)"], ["Cores", "1,600 stream processors, 850 MHz"], ["Hashrate", "313-481 MH/s by miner and clocks"], ["Board power", "188 W"], ["This rig", "4 cards: ~1.6 GH/s on ~900 W"], ["Miners", "poclbm, Phoenix, DiabloMiner"]],
      note: "Hashrates from the Bitcoin Wiki's table of measured results.", sources: [SRC.gpu] },
    { year: 2010.95, title: "POOLS", name: "Mining pools", model: "pool", jth: null,
      text: "Slush's pool found its first block in December 2010: miners share the work and split the reward for steadier pay.",
      stats: [["Idea", "share the work"], ["Pay", "small, steady"], ["Today", "most hashrate"]],
      about: "Alone, a small miner could wait months for a block. A pool hands everyone the same block to work on and counts easier near-misses, shares, as proof of each one's work; when anyone finds the block, the reward is split by shares. Slush's pool was the first, in late 2010.",
      specs: [["First", "Slush's pool, first block December 2010"], ["Shares", "easier hashes that prove the work"], ["Pay", "each reward split by shares"], ["Today", "nearly all hashrate mines in pools"]],
      note: "A pool is an idea, not a machine: here a rack of servers and its switch.", sources: [] },
    { year: 2011.75, title: "FPGA", name: "X6500 FPGA miner", model: "fpga", jth: 4.3e4,
      text: "Two programmable Spartan-6 chips: a graphics card's hashrate on a tenth of its power.",
      stats: [["Hashrate", "400 MH/s"], ["Power", "17.2 W"], ["J/TH", "~43,000"]],
      about: "FPGAs are chips whose logic is wired by a program. Wired for SHA-256 and nothing else, two of them matched a graphics card's hashrate on the power of a light bulb, the first step from general-purpose hardware toward chips made only to mine.",
      specs: [["Chips", "2 × Xilinx Spartan-6 LX150 FPGA"], ["Hashrate", "400 MH/s"], ["Power", "17.2 W"], ["Efficiency", "23 MH/J"], ["Price", "$550 (2011)"]],
      note: "Figures from the Bitcoin Wiki's mining hardware table.", sources: [SRC.hw] },
    { year: 2013.05, title: "ASIC", name: "Avalon and Block Erupter", model: "avalon", jth: 9400,
      text: "The first chips made only for SHA-256. Avalon's first batch shipped in January 2013.",
      stats: [["Avalon", "66.3 GH/s"], ["USB stick", "~336 MH/s"], ["J/TH", "~9,400"]],
      about: "An ASIC does one thing. Avalon's A3256, made at 110 nm, was the first Bitcoin ASIC on sale; its first batch of miners shipped in January 2013, and ASICMiner's Block Erupter put an ASIC on a USB stick the same year. From here on, only chips made to mine could keep up.",
      specs: [["Avalon Batch 1", "66.3 GH/s on 620 W, $1,299"], ["Its chip", "A3256, 110 nm (TSMC)"], ["First shipped", "January 2013"], ["Block Erupter USB", "~336 MH/s on ~2.6 W"], ["Efficiency", "Avalon ~9.4 J/GH, the stick ~7.6 J/GH"]],
      note: "Figures from the Bitcoin Wiki.", sources: [SRC.hw, SRC.avalon] },
    { year: 2016.4, title: "S9", name: "Antminer S9", model: "s9", jth: 98,
      text: "The workhorse of its era, still hashing in places years later.",
      stats: [["Hashrate", "14 TH/s"], ["Power", "1,375 W"], ["J/TH", "98"]],
      about: "Bitmain's S9 sold in vast numbers from 2016: three hash boards in an aluminium shell, a fan at each end and a power supply beside it. It carried the network through the 2017 run and kept hashing wherever power was cheap long after.",
      specs: [["Hashrate", "13.5-14 TH/s"], ["Power", "~1,375 W"], ["Efficiency", "~98 J/TH"], ["Chips", "189 × BM1387 (16 nm)"], ["Size", "350 × 135 × 158 mm"], ["Weight", "4.2 kg"], ["Power supply", "separate (APW3)"], ["Released", "2016"]],
      note: "Model 1.6 times life size, its power supply beside it.", sources: [SRC.hw] },
    { year: 2019.3, title: "S17", name: "Antminer S17 Pro", model: "s17", jth: 39.5,
      text: "7 nm chips pass 50 TH/s in one box.",
      stats: [["Hashrate", "53 TH/s"], ["Power", "2,094 W"], ["J/TH", "39.5"]],
      about: "The S17 moved Bitmain to 7 nm chips and nearly quadrupled the S9's hashrate in a box hardly bigger, at under half its joules a terahash.",
      specs: [["Hashrate", "53 TH/s"], ["Power", "2,094 W"], ["Efficiency", "39.5 J/TH"], ["Chips", "BM1397 (7 nm)"], ["Size", "~298 × 178 × 296 mm"], ["Weight", "~9.5 kg"], ["Released", "2019"]],
      note: "Size and weight as commonly listed; model 1.6 times life size.", sources: [SRC.hw] },
    { year: 2020.4, title: "S19", name: "Antminer S19 Pro", model: "s19", jth: 29.5,
      text: "Over 100 TH/s, shipping around the 2020 halving.",
      stats: [["Hashrate", "110 TH/s"], ["Power", "3,250 W"], ["J/TH", "29.5"]],
      about: "The S19 Pro set the shape miners still have: a long box with two fans at each end and the power supply on top, past 100 TH/s for the first time.",
      specs: [["Hashrate", "110 TH/s"], ["Power", "3,250 W"], ["Efficiency", "29.5 J/TH"], ["Chips", "7 nm"], ["Size", "400 × 195.5 × 290 mm"], ["Weight", "13.2-14.4 kg"], ["Released", "2020"]],
      note: "Weight varies by batch; model 1.6 times life size.", sources: [SRC.hw] },
    { year: 2023.85, title: "S21", name: "Antminer S21", model: "s21", jth: 17.5,
      text: "200 TH/s in one box, below 20 joules a terahash.",
      stats: [["Hashrate", "200 TH/s"], ["Power", "3,500 W"], ["J/TH", "17.5"]],
      about: "5 nm chips in the S19's shape: twice the hashrate, below 20 joules a terahash. One S21 outhashes the whole 2012 network about 13 times over.",
      specs: [["Hashrate", "200 TH/s"], ["Power", "3,500 W"], ["Efficiency", "17.5 J/TH"], ["Chips", "BM1368 (5 nm)"], ["Size", "400 × 195 × 290 mm"], ["Weight", "15.4 kg"], ["Released", "late 2023"]],
      note: "From Bitmain's specification; model 1.6 times life size.", sources: [SRC.s21] },
    { year: 2024.7, title: "BITAXE", name: "Bitaxe Gamma", model: "bitaxe", jth: 15,
      text: "An open-source home miner the size of a hand: one S21 Pro chip on the power of a desk lamp.",
      stats: [["Hashrate", "~1.2 TH/s"], ["Power", "~17-20 W"], ["J/TH", "~15"]],
      about: "Open hardware and open firmware: one of Bitmain's newest chips on a board the size of a hand, a little screen and Wi-Fi. Too small to earn much, it mines solo for the lottery of a whole block, and anyone can build one.",
      specs: [["Hashrate", "~1.2 TH/s"], ["Power", "~17-20 W"], ["Efficiency", "~15 J/TH"], ["Chip", "one BM1370 (the S21 Pro's)"], ["Controller", "ESP32-S3, Wi-Fi"], ["Firmware", "open source (AxeOS)"], ["Use", "solo mining at home"]],
      note: "Figures vary with tuning; model 1.6 times life size.", sources: [] },
    { year: 2024.9, title: "HYDRO", name: "Antminer S21 XP Hydro", model: "hydro", jth: 12,
      text: "Water-cooled for warehouses and heat reuse.",
      stats: [["Hashrate", "473 TH/s"], ["Power", "5,676 W"], ["J/TH", "12"]],
      about: "No fans: water through cold plates carries the heat away, quietly, to a dry cooler outside or to heat a building. Nearly half a petahash in a box, at 12 joules a terahash.",
      specs: [["Hashrate", "473 TH/s"], ["Power", "5,676 W"], ["Efficiency", "12.0 J/TH"], ["Cooling", "water, no fans"], ["Input", "380-415 V AC"], ["Size", "~410 × 170 × 209 mm"], ["Weight", "~13.8 kg"], ["Released", "2024"]],
      note: "Power and hashrate from Bitmain; size and weight as listed by sellers.", sources: [SRC.xp] }
  ];
  // Network hashrate, log10 of hashes a second: mempool.space's daily estimates (/api/v1/mining/hashrate/all)
  // averaged over five weeks round each point, every quarter from January 2009 to November 2026.
  const HISTORY = [[2009.05, 6.74], [2009.3, 6.76], [2009.55, 6.5], [2009.8, 6.53], [2010.05, 7.05], [2010.3, 7.88], [2010.55, 9.18], [2010.8, 10.28],
    [2011.05, 11.19], [2011.3, 11.92], [2011.55, 13.1], [2011.8, 12.97], [2012.05, 12.98], [2012.3, 13.06], [2012.55, 13.15], [2012.8, 13.36],
    [2013.05, 13.36], [2013.3, 13.84], [2013.55, 14.39], [2013.8, 15.41], [2014.05, 16.2], [2014.3, 16.74], [2014.55, 17.13], [2014.8, 17.43],
    [2015.05, 17.49], [2015.3, 17.53], [2015.55, 17.57], [2015.8, 17.65], [2016.05, 17.96], [2016.3, 18.12], [2016.55, 18.18], [2016.8, 18.26],
    [2017.05, 18.44], [2017.3, 18.58], [2017.55, 18.78], [2017.8, 18.97], [2018.05, 19.26], [2018.3, 19.45], [2018.55, 19.61], [2018.8, 19.71],
    [2019.05, 19.63], [2019.3, 19.66], [2019.55, 19.83], [2019.8, 19.97], [2020.05, 20.04], [2020.3, 20.05], [2020.55, 20.09], [2020.8, 20.12],
    [2021.05, 20.18], [2021.3, 20.21], [2021.55, 20.01], [2021.8, 20.18], [2022.05, 20.27], [2022.3, 20.33], [2022.55, 20.31], [2022.8, 20.42],
    [2023.05, 20.44], [2023.3, 20.54], [2023.55, 20.57], [2023.8, 20.65], [2024.05, 20.73], [2024.3, 20.79], [2024.55, 20.79], [2024.8, 20.84],
    [2025.05, 20.9], [2025.3, 20.94], [2025.55, 20.96], [2025.8, 21.03], [2026.05, 20.99], [2026.3, 20.98], [2026.55, 20.96], [2026.84, 21.01]];
  // Today's rate as the crown shows it with no live reading: the 30-day average to 10 November 2026.
  const BAKED = { rate: 1.03e21, when: "30-day average · Nov 2026" };
  // The chart wraps the dome from 2009 by the door on the left (azimuth -168) to its end on the right (168), the same
  // distance either side of the unit labels over the door (180).
  const START = 2009, END = 2026.9, azOf = (yr) => -168 + (yr - START) / (END - START) * 336;
  // The eras' tints are faint: the dome's screen shows its canvas about twice as bright as it is painted.
  const ERAS = [["CPU", 2009, 2010.5, "rgba(120,160,255,.06)"], ["GPU", 2010.5, 2011.5, "rgba(80,220,140,.06)"], ["FPGA", 2011.5, 2013, "rgba(230,200,60,.06)"], ["ASIC", 2013, END, "rgba(247,147,26,.04)"]];
  const UNITS = [[6, "MH/s"], [9, "GH/s"], [12, "TH/s"], [15, "PH/s"], [18, "EH/s"], [21, "ZH/s"]];
  // The exhibits' azimuths: their years', pushed apart where years crowd so neighbours keep 13 degrees.
  const AZ = [];
  MINERS.forEach((ex, i) => { const a = azOf(ex.year); AZ.push(i && a < AZ[i - 1] + 13 ? AZ[i - 1] + 13 : a); });
  const headingTo = (x, z, tx, tz) => Math.atan2(-(tx - x), -(tz - z));
  // Plinths (their top at TOP), and the big S21's scale.
  const TOP = 0.9, BIG = 2.2;

  // ---------- the models, 1.6 times life size, each on its plinth with its front to -z (the ring's middle) ----------
  // Real sizes in millimetres, scaled to the museum's by `mm`. Every label and screen is drawn in the island's letters
  // as geometry, so the viewer (which draws faces alone) shows them as the hall does.
  const mm = (v) => v * 1.6e-3;
  const ANTMINER = {
    s9: { len: 350, wid: 135, hei: 158, psu: "side", fans: 1, color: "#b8bec6", frame: "#8d939b", text: "S9" },
    s17: { len: 298, wid: 178, hei: 296, psu: "top", fans: 2, color: "#aab0b8", frame: "#7f858d", text: "S17 PRO" },
    s19: { len: 400, wid: 195.5, hei: 290, psu: "top", fans: 2, color: "#b4b9bf", frame: "#868c94", text: "S19 PRO" },
    s21: { len: 400, wid: 195, hei: 290, psu: "top", fans: 2, color: "#7d838c", frame: "#555a62", text: "S21" },
    hydro: { len: 410, wid: 170, hei: 209, psu: "in", fans: 0, color: "#3a3e45", frame: "#25282d", text: "S21 XP HYD" }
  };
  // A miner in kit `k`, standing at height `y`, `s` times the museum's size.
  const model = (k, kind, s = 1, y = 0) => {
    const B = (w, h, d, color, x, yy, z, o) => k.box(w * s, h * s, d * s, color, x * s, y + yy * s, z * s, o);
    const Y = (rt, rb, h, color, x, yy, z, o) => k.cyl(rt * s, rb * s, h * s, color, x * s, y + yy * s, z * s, o);
    const R = (rr, r, color, x, yy, z, o) => k.torus(rr * s, r * s, color, x * s, y + yy * s, z * s, o);
    const lit = (w, h, d, color, x, yy, z, e = 0.95) => B(w, h, d, color, x, yy, z, { emissive: e, glow: true });
    // Words in the island's letters, `px` a pixel, facing -z (turned by `ry`) about (x, yy, z).
    const say = (text, px, color, x, yy, z, ry = 0, e = 0.25) => k.add(RM.helpers.litWord(text, px * s, color, e), x * s, y + yy * s, z * s, { ry });
    // A fan on an end facing `dir` (-1 toward -z, 1 toward +z), `w` across, its middle at (x, yy) and that end at z: its
    // square frame, the dark well, seven swept blades round the hub, and the wire guard's rings and spokes.
    const fan = (w, x, yy, z, dir) => {
      const at = (t) => z + dir * t, round = { rx: Math.PI / 2 };
      B(w, w, 0.01, C.fanPlate, x, yy, at(0.005));
      Y(0.46 * w, 0.46 * w, 0.004, C.fanHole, x, yy, at(0.011), { ...round, seg: 18 });
      for (let b = 0; b < 7; b++) { const a = b / 7 * P.TAU; B(0.3 * w, 0.11 * w, 0.004, C.blade, x + Math.cos(a) * 0.24 * w, yy + Math.sin(a) * 0.24 * w, at(0.015), { rz: a + 0.6 }); }
      Y(0.13 * w, 0.13 * w, 0.008, C.hub, x, yy, at(0.019), { ...round, seg: 12 });
      for (const r of [0.2, 0.33, 0.45]) R(r * w, 0.004, "#60656c", x, yy, at(0.024), { ...round, seg: 24, sides: 3 });
      for (let b = 0; b < 4; b++) B(0.9 * w, 0.006, 0.004, "#60656c", x, yy, at(0.024), { rz: b * Math.PI / 4 });
    };
    // A label: a white plate with ANTMINER over the model, on the face toward -z at (x, yy, z), turned by `ry`.
    const label = (text, w, x, yy, z, ry = 0) => {
      const c = Math.cos(ry), sn = Math.sin(ry), along = (d) => [x - sn * d, z - c * d];
      const [px, pz] = along(0.004);
      k.add(BL.models.box({ w: w * s, h: w * 0.42 * s, d: 0.004 * s, color: C.label }), px * s, y + yy * s, pz * s, { ry });
      const [tx, tz] = along(0.007);
      say("ANTMINER", w / 60, "#17110a", tx, yy + w * 0.08, tz, ry, 0.1);
      say(text, w / Math.max(40, text.length * 6.5), "#17110a", tx, yy - w * 0.09, tz, ry, 0.1);
    };

    if (kind === "cpu") {
      // A high-end 2009 desktop: a black tower, its side open on an X58 board with a tower cooler on the CPU, RAM, a
      // graphics card and the power supply; a 20-inch screen running Bitcoin 0.1 with Generate Coins on; keyboard
      // and mouse.
      const tx = -0.42, tw = mm(205), th = mm(470), td = mm(470), side = tx - tw / 2;
      B(tw, th, td, "#16171a", tx, th / 2, 0);
      B(tw * 0.96, th * 0.98, 0.012, "#0e0f11", tx, th / 2, -td / 2 - 0.006);
      for (let i = 0; i < 2; i++) { B(tw * 0.84, mm(42), 0.008, "#2a2c30", tx, th - mm(60) - i * mm(48), -td / 2 - 0.014); B(tw * 0.6, 0.004, 0.004, "#55585e", tx, th - mm(60) - i * mm(48), -td / 2 - 0.019); }
      for (let i = 0; i < 6; i++) B(tw * 0.84, 0.006, 0.006, "#22242a", tx, mm(70) + i * mm(30), -td / 2 - 0.014);
      R(0.022, 0.005, "#2b6fd8", tx, th - mm(170), -td / 2 - 0.016, { rx: Math.PI / 2, seg: 14, sides: 3, emissive: 0.9, glow: true });
      lit(0.008, 0.008, 0.004, "#ff9a2a", tx + 0.05, th - mm(170), -td / 2 - 0.016);
      // The open side: the board, the CPU's cooler (fins and fan), six blue sticks of RAM, the graphics card and the
      // power supply at the foot, the case's frame round the opening.
      const sx = side - 0.003;
      B(0.004, th * 0.86, td * 0.86, "#0d0e10", sx + 0.006, th * 0.5, 0);
      B(0.006, mm(305), mm(244), "#1c2b22", sx + 0.01, th * 0.58, mm(20));
      B(0.012, mm(60), mm(60), "#9aa0a8", sx + 0.004, th * 0.7, -mm(10));
      for (let f = 0; f < 9; f++) B(0.07, mm(120), 0.003, "#c9ccd2", sx - 0.03, th * 0.7, -mm(50) + f * mm(10));
      Y(mm(55), mm(55), 0.01, "#202226", sx - 0.068, th * 0.7, -mm(10), { rz: Math.PI / 2, seg: 16 });
      Y(mm(18), mm(18), 0.012, "#3a3d42", sx - 0.072, th * 0.7, -mm(10), { rz: Math.PI / 2, seg: 10 });
      for (let r = 0; r < 6; r++) B(0.012, mm(130), 0.006, "#2f6fd6", sx - 0.004, th * 0.72, mm(70) + r * mm(9));
      B(0.03, mm(110), mm(260), "#1a1a1c", sx - 0.012, th * 0.4, mm(10));
      B(0.032, 0.006, mm(260), "#c8102e", sx - 0.013, th * 0.4 + mm(52), mm(10));
      B(0.008, mm(86), mm(150), "#2a2c30", sx + 0.004, mm(60), mm(140));
      for (const [h, d, yy, z] of [[th, 0.02, th / 2, -td / 2 + 0.01], [th, 0.02, th / 2, td / 2 - 0.01], [0.02, td, th - 0.01, 0], [0.02, td, 0.01, 0]]) B(0.012, h, d, "#26272b", sx, yy, z);
      // The screen on its stand, Bitcoin 0.1 lit on it.
      const mx = 0.2, mw = mm(470), mh = mm(320), my = mm(110) + mh / 2, mz = 0.06;
      B(mm(240), 0.012, mm(190), "#141518", mx, 0.006, mz + 0.05);
      B(mm(50), mm(110), mm(30), "#141518", mx, mm(60), mz + 0.07);
      B(mw, mh, 0.03, "#121316", mx, my, mz);
      // Its layers stand a clear step apart and the window shares the screen's middle, so a face-sorting renderer (the
      // viewer, Canvas 2D) keeps them in order from any side.
      B(mw - 0.04, mh - 0.05, 0.004, "#0b0e12", mx, my, mz - 0.019);
      const sw = mw - 0.06, wh = mh - 0.09, top = my + wh / 2 - 0.015, left = mx + sw / 2;
      lit(sw, wh, 0.002, "#d8d4c8", mx, my, mz - 0.028, 0.6);
      lit(sw, 0.03, 0.002, "#2b5fae", mx, top, mz - 0.034, 0.8);
      say("BITCOIN", 0.0045, "#ffffff", left - 0.12, top, mz - 0.037, 0, 0.9);
      say("BALANCE  50.00", 0.0042, "#1a1a1a", mx, top - 0.06, mz - 0.037, 0, 0.5);
      say("GENERATE COINS: ON", 0.0042, "#1a1a1a", mx, top - 0.1, mz - 0.037, 0, 0.5);
      say("BLOCKS  1207", 0.0042, "#1a1a1a", mx, top - 0.14, mz - 0.037, 0, 0.5);
      // The keyboard, its keys in rows, and the mouse.
      const kx = 0.14, kz = -0.32;
      B(mm(450), 0.02, mm(150), "#1a1b1e", kx, 0.01, kz);
      for (let r = 0; r < 5; r++) for (let c = 0; c < 15; c++) B(mm(23), 0.008, mm(22), "#2c2e33", kx - mm(200) + c * mm(28.5), 0.024, kz - mm(58) + r * mm(28));
      B(mm(65), 0.022, mm(110), "#1a1b1e", kx + mm(330), 0.011, kz + 0.01);
      return {};
    }
    if (kind === "gpu") {
      // An open aluminium frame: the board on the floor of it, four Radeon HD 5870s standing on riser cables, the power
      // supply at the side.
      for (const [x, z] of [[-0.3, -0.27], [0.3, -0.27], [-0.3, 0.27], [0.3, 0.27]]) B(0.025, 0.46, 0.025, C.alu, x, 0.23, z);
      for (const z of [-0.27, 0.27]) B(0.62, 0.02, 0.025, C.alu, 0, 0.45, z);
      for (const x of [-0.3, 0.3]) B(0.025, 0.02, 0.56, C.alu, x, 0.45, 0);
      B(0.6, 0.012, 0.56, "#9aa0a8", 0, 0.006, 0);
      B(mm(244), 0.012, mm(305), "#1c2b22", -0.05, 0.02, 0.02);
      for (let r = 0; r < 4; r++) B(0.012, mm(120), 0.008, "#2f6fd6", 0.06, 0.06, -0.12 + r * 0.012);
      B(mm(150), mm(86), mm(160), "#2a2c30", 0.44, mm(43), 0.1);
      fan(mm(80), 0.44, mm(43), 0.1 - mm(80), -1);
      [-0.18, -0.06, 0.06, 0.18].forEach((x) => {
        const cl = mm(281), ch = mm(111), cw = mm(38), cy = 0.24 + ch / 2;
        B(cw, ch, cl, "#1a1a1c", x, cy, 0);
        B(cw + 0.002, 0.008, cl, "#c8102e", x, cy + ch / 2 - 0.012, 0);
        B(0.006, ch + 0.02, 0.012, "#b8bec6", x, cy, -cl / 2 - 0.006);
        for (let p = 0; p < 2; p++) B(0.008, 0.016, 0.03, "#0c0c0e", x, cy - 0.04 + p * 0.03, -cl / 2 - 0.016);
        Y(mm(36), mm(36), 0.006, "#0c0c0e", x - cw / 2 - 0.002, cy, cl / 2 - mm(60), { rz: Math.PI / 2, seg: 16 });
        Y(mm(12), mm(12), 0.008, "#3a3d42", x - cw / 2 - 0.004, cy, cl / 2 - mm(60), { rz: Math.PI / 2, seg: 10 });
        for (let p = 0; p < 2; p++) B(0.012, 0.012, 0.022, "#0c0c0e", x, cy + ch / 2 + 0.006, cl / 2 - mm(30) - p * 0.03);
        B(0.012, 0.22, 0.004, "#b38b3a", x, 0.13, 0.05);
      });
      return {};
    }
    if (kind === "pool") {
      // A small rack: two servers and the pool's switch, cables to four miners round its foot.
      const rw = mm(330), rh = mm(370), rd = mm(300);
      B(rw, rh, rd, "#1b1c20", 0, rh / 2, 0);
      for (let u = 0; u < 3; u++) {
        const yy = rh - 0.1 - u * mm(70);
        B(rw * 0.92, mm(44), 0.01, u === 2 ? "#26292e" : "#2e3137", 0, yy, -rd / 2 - 0.005);
        for (let l = 0; l < (u === 2 ? 12 : 3); l++) lit(0.008, 0.008, 0.004, l % 3 ? C.led : C.amber, -rw * 0.38 + l * (u === 2 ? 0.036 : 0.05), yy, -rd / 2 - 0.012);
      }
      for (let i = 0; i < 4; i++) {
        const a = (i + 0.5) / 4 * P.TAU, x = Math.sin(a) * 0.42, z = Math.cos(a) * 0.36;
        B(0.14, 0.12, 0.14, "#2a2c30", x, 0.06, z);
        fan(0.09, x, 0.06, z - 0.07, -1);
        lit(0.01, 0.01, 0.004, C.led, x + 0.05, 0.1, z - 0.072);
        B(0.012, 0.012, Math.hypot(x, z) - 0.16, C.cable, x / 2, 0.012, z / 2, { ry: Math.atan2(x, z) });
      }
      return {};
    }
    if (kind === "fpga") {
      // Two X6500 boards on standoffs: each two Spartan-6 chips under finned heatsinks with fans, USB and power.
      for (const z of [-0.12, 0.12]) {
        const bw = mm(150), bd = mm(100), by = 0.05;
        for (const [x, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) Y(0.006, 0.006, by, C.alu, x * bw * 0.44, by / 2, z + dz * bd * 0.42, { seg: 6 });
        B(bw, 0.004, bd, "#18241c", 0, by, z);
        for (const x of [-0.06, 0.06]) {
          B(mm(40), 0.008, mm(40), "#c9ccd2", x, by + 0.008, z);
          for (let f = 0; f < 5; f++) B(mm(40), 0.016, 0.003, "#c9ccd2", x, by + 0.02, z - mm(16) + f * mm(8));
          fan(mm(40), x, by + 0.032, z, 1);
        }
        B(0.02, 0.012, 0.02, "#8a8f96", -bw / 2 + 0.012, by + 0.008, z - bd / 2 + 0.015);
        B(0.016, 0.016, 0.022, "#0c0c0e", bw / 2 - 0.012, by + 0.01, z - bd / 2 + 0.015);
        lit(0.006, 0.004, 0.006, C.led, 0, by + 0.004, z - bd / 2 + 0.01);
      }
      return {};
    }
    if (kind === "avalon") {
      // Avalon's first batch: a black steel box with a fan grille and the orange stripe; three Block Erupters in a hub.
      const aw = mm(200), ah = mm(320), ad = mm(300), ax = -0.16;
      B(aw, ah, ad, "#232327", ax, ah / 2, 0);
      lit(aw + 0.004, 0.03, ad + 0.004, "#f28a1a", ax, ah - 0.06, 0, 0.9);
      fan(aw * 0.82, ax, ah * 0.45, -ad / 2, -1);
      for (let r = 0; r < 7; r++) B(0.004, 0.006, ad * 0.8, "#121214", ax + aw / 2 + 0.002, 0.08 + r * 0.05, 0);
      say("AVALON", 0.006, "#f2f2f2", ax, ah - 0.11, -ad / 2 - 0.004, 0, 0.4);
      B(0.012, 0.012, 0.012, "#0c0c0e", ax + 0.07, 0.05, -ad / 2 - 0.006);
      // The USB hub and its sticks: blue boards, aluminium heatsinks, the plugs down in the hub.
      B(mm(140), mm(22), mm(60), "#1a1b1e", 0.26, mm(11), 0);
      for (let i = 0; i < 3; i++) {
        const x = 0.2 + i * 0.06, sy = mm(22) + mm(50);
        B(mm(10), mm(100), mm(30), "#2556b4", x, sy, 0);
        B(mm(14), mm(46), mm(26), "#c9a23a", x, sy + mm(10), 0);
        for (let f = 0; f < 4; f++) B(mm(18), mm(40), 0.003, "#c9a23a", x, sy + mm(10), -mm(9) + f * mm(6));
        lit(0.006, 0.006, 0.004, C.led, x, sy - mm(36), -mm(16));
      }
      return {};
    }
    if (kind === "bitaxe") {
      // The Bitaxe Gamma: its board on standoffs, the chip's heatsink and fan, the ESP32 module, the little screen
      // (hashrate on it), the power jack and the USB port.
      const bw = mm(100), bd = mm(76), by = 0.03;
      for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) Y(0.006, 0.006, by, C.alu, x * bw * 0.44, by / 2, z * bd * 0.42, { seg: 6 });
      B(bw, 0.004, bd, "#16181c", 0, by, 0);
      B(mm(40), 0.006, mm(40), "#c9ccd2", 0.012, by + 0.006, 0.01);
      for (let f = 0; f < 7; f++) B(mm(40), mm(14), 0.0025, "#c9ccd2", 0.012, by + 0.02, 0.01 - mm(17) + f * mm(5.6));
      fan(mm(40), 0.012, by + 0.042, 0.01, 1);
      B(mm(18), 0.006, mm(25), "#9aa0a8", -0.055, by + 0.005, 0.02);
      B(mm(38), mm(12), 0.004, "#0c0c0e", -0.03, by + mm(8), -bd / 2 + 0.006);
      say("1.2 TH/S", 0.0012, "#bfe8ff", -0.03, by + mm(8), -bd / 2 + 0.003, 0, 0.9);
      B(0.016, 0.014, 0.02, "#0c0c0e", bw / 2 - 0.012, by + 0.009, -bd / 2 + 0.012);
      B(0.014, 0.006, 0.01, "#8a8f96", bw / 2 - 0.035, by + 0.005, -bd / 2 + 0.006);
      lit(0.004, 0.003, 0.004, C.led, -bw / 2 + 0.01, by + 0.004, -bd / 2 + 0.01);
      return {};
    }
    // An Antminer: its shell, darker end frames, its fans, the hash boards' bolts down its sides, its power supply on
    // top (or beside it, the S9's), the controller's port and lights at the front corner, and its label on the side.
    const A = ANTMINER[kind], len = mm(A.len), wid = mm(A.wid), hei = mm(A.hei), top = A.psu === "top" ? mm(50) : 0, body = hei - top;
    B(wid, body, len, A.color, 0, body / 2, 0);
    for (const dz of [-1, 1]) B(wid + 0.006, body + 0.006, 0.02, A.frame, 0, body / 2, dz * (len / 2 - 0.01));
    for (const sx of [-1, 1]) for (let i = 1; i <= 3; i++) for (let b = 0; b < 4; b++) B(0.004, 0.008, 0.008, A.frame, sx * (wid / 2 + 0.002), body * i / 4, -len * 0.36 + b * len * 0.24);
    if (A.fans) {
      const f = Math.min(wid * 0.92, body / A.fans * 0.92);
      for (const dir of [-1, 1]) for (let n = 0; n < A.fans; n++) fan(f, 0, body * (n + 0.5) / A.fans, dir * len / 2, dir);
    } else {
      // Water-cooled: a closed front with the water in and out (blue and red couplings) and no fans.
      B(wid * 0.9, body * 0.85, 0.01, "#24272c", 0, body / 2, -len / 2 - 0.006);
      for (const [x, color] of [[-wid * 0.22, "#2b6fd8"], [wid * 0.22, "#d8402b"]]) {
        Y(0.022, 0.022, 0.05, "#b8bec6", x, body * 0.35, -len / 2 - 0.03, { rx: Math.PI / 2, seg: 12 });
        Y(0.026, 0.026, 0.02, color, x, body * 0.35, -len / 2 - 0.06, { rx: Math.PI / 2, seg: 12 });
      }
    }
    if (A.psu === "top") {
      B(wid * 0.96, top, len * 0.94, "#2a2d32", 0, body + top / 2, 0);
      fan(top * 0.86, wid * 0.25, body + top / 2, -len * 0.47, -1);
      B(0.03, 0.02, 0.012, "#0c0c0e", -wid * 0.25, body + top / 2, len * 0.47 + 0.006);
    }
    if (A.psu === "side") {
      const pl = mm(260), pw = mm(150), ph = mm(86), px = wid / 2 + 0.06 + pw / 2;
      B(pw, ph, pl, "#2a2d32", px, ph / 2, 0.02);
      fan(ph * 0.86, px, ph / 2, 0.02 - pl / 2, -1);
      for (let c = 0; c < 3; c++) B(0.06 + pw / 2, 0.01, 0.01, "#121214", wid / 2 + (0.06 + pw / 2) / 2, ph - 0.015, -0.08 + c * 0.06);
    }
    // The controller at the front's top corner: its network port and two lights.
    const cx = wid / 2 - 0.035, cy = body - 0.03, cz = -len / 2 - 0.012;
    B(0.05, 0.035, 0.006, "#1c1e22", cx, cy, cz);
    B(0.016, 0.014, 0.006, "#0c0c0e", cx - 0.01, cy, cz - 0.004);
    lit(0.006, 0.006, 0.004, C.led, cx + 0.012, cy + 0.008, cz - 0.004);
    lit(0.006, 0.006, 0.004, "#ff4a3d", cx + 0.012, cy - 0.006, cz - 0.004);
    label(A.text, Math.min(len * 0.42, 0.22), -wid / 2, body * 0.55, len * 0.05, Math.PI / 2);
    return {};
  };
  // The plinth every exhibit stands on: pale stone with an amber band under its top.
  const plinth = own(() => merge(
    box({ w: 1.2, h: TOP, d: 1.2, color: C.stone, offset: { y: TOP / 2 } }),
    box({ w: 1.24, h: 0.04, d: 1.24, color: C.amber, emissive: 1, offset: { y: TOP - 0.04 } })
  ));
  // Each exhibit's model alone, at the museum's size, for the viewer.
  const viewModel = own(() => MINERS.map((ex) => RM.solo((k) => model(k, ex.model, 1, 0))));

  // ---------- pictures ----------
  // A plaque, `k` times its 560 by 440 size: year and title, name, the line, and three stats.
  const PLAQUE = { w: 560, h: 440 };
  const paintPlaque = (ctx, ex, k = 1) => {
    const W = PLAQUE.w * k, H = PLAQUE.h * k;
    ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = C.amber; ctx.lineWidth = 6 * k; ctx.strokeRect(6 * k, 6 * k, W - 12 * k, H - 12 * k);
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    P.pix(ctx, `${Math.floor(ex.year)} · ${ex.title}`, 28 * k, 48 * k, 30 * k, C.amberText, "left");
    ctx.fillStyle = C.white; P.fit(ctx, ex.name, 500 * k, 700, 36 * k); ctx.fillText(ex.name, 28 * k, 112 * k);
    ctx.fillStyle = "#d4c8b6"; ctx.font = P.font(400, 23 * k);
    let line = "", y = 152 * k;
    for (const word of ex.text.split(" ")) {
      const t = line ? line + " " + word : word;
      if (ctx.measureText(t).width > 500 * k) { ctx.fillText(line, 28 * k, y); y += 30 * k; line = word; } else line = t;
    }
    ctx.fillText(line, 28 * k, y);
    // Efficiency on a log scale from 10^7.5 joules a terahash (left) to 10^0.5 (right): every machine a tick, this one
    // lit, so walking the ring the dot runs from one end to the other.
    if (ex.jth) {
      const x0 = 28 * k, w = 504 * k, at = (j) => x0 + (7.5 - Math.log10(j)) / 7 * w;
      P.pix(ctx, "JOULES A TERAHASH · LOG SCALE", x0, 250 * k, 12 * k, "#8c7f6c", "left");
      ctx.fillStyle = "#2b2520"; P.roundRect(ctx, x0, 264 * k, w, 12 * k, 6 * k); ctx.fill();
      ctx.fillStyle = "rgba(247,147,26,.45)"; P.roundRect(ctx, x0, 264 * k, at(ex.jth) - x0, 12 * k, 6 * k); ctx.fill();
      for (const other of MINERS) if (other.jth && other !== ex) { ctx.fillStyle = "#6e6457"; ctx.fillRect(at(other.jth) - 1.5 * k, 261 * k, 3 * k, 18 * k); }
      ctx.fillStyle = C.amberText; ctx.beginPath(); ctx.arc(at(ex.jth), 270 * k, 10 * k, 0, P.TAU); ctx.fill();
      ctx.fillStyle = "#8c7f6c"; ctx.font = P.font(500, 15 * k, P.MONO); ctx.textAlign = "center";
      for (const [j, label] of [[1e7, "10,000,000"], [1e5, "100,000"], [1e3, "1,000"], [10, "10"]]) ctx.fillText(label, at(j), 302 * k);
      ctx.textAlign = "left";
    }
    ex.stats.forEach(([key, value], i) => {
      const x = (28 + i * 172) * k;
      ctx.fillStyle = "#d98a2b"; ctx.font = P.font(500, 19 * k); ctx.fillText(key, x, 360 * k);
      ctx.fillStyle = C.white; P.fit(ctx, value, 160 * k, 600, 26 * k, P.MONO); ctx.fillText(value, x, 398 * k);
    });
  };
  const plaques = own(() => MINERS.map((ex) => {
    const canvas = CH.canvas(PLAQUE.w, PLAQUE.h);
    paintPlaque(canvas.getContext("2d"), ex);
    return RM.flatPicture(canvas, 1, 0.79);
  }));
  // The sign on the middle plinth's front.
  const paintSign = (ctx, w, h) => {
    ctx.fillStyle = C.ink; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = C.amber; ctx.lineWidth = h * 0.04; ctx.strokeRect(h * 0.04, h * 0.04, w - h * 0.08, h - h * 0.08);
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = C.white;
    for (const [text, y] of [["One S21 (200 TH/s) outhashes the whole", 0.27], ["2012 network (~16 TH/s) about 13 times over", 0.5]]) { P.fit(ctx, text, w * 0.9, 600, h * 0.14); ctx.fillText(text, w / 2, h * y); }
    P.pix(ctx, "MODELS 1.6X LIFE SIZE · STATS APPROXIMATE", w / 2, h * 0.76, h * 0.075, C.amberText);
  };
  // The crown: today's rate in full, live from mempool.space's reading when there is one, else the baked figure. Its
  // picture is laid out on 1024 units and painted at CROWN pixels, small enough that Canvas 2D's shaded-picture cache
  // keeps it whole beside the plaques.
  const CROWN = 768;
  const spelled = (rate) => {
    const e = Math.floor(Math.log10(rate)), lead = String(Math.round(rate / 10 ** (e - 2)));
    return (lead + "0".repeat(Math.max(0, e - 2))).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  const paintCrown = (ctx, reader, now) => {
    const N = CROWN, u = N / 1024, cx = N / 2, v = reader.value("hashrate"), rate = v && v.current > 0 ? v.current : BAKED.rate;
    ctx.fillStyle = "#0a0b0f"; ctx.fillRect(0, 0, N, N);
    ctx.strokeStyle = C.amber; ctx.lineWidth = 8 * u; ctx.beginPath(); ctx.arc(cx, cx, 480 * u, 0, P.TAU); ctx.stroke();
    ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    P.pix(ctx, "THE NETWORK TODAY", cx, 320 * u, 40 * u, C.amberText);
    ctx.fillStyle = C.white; ctx.font = P.font(600, 130 * u, P.MONO);
    ctx.fillText(rate >= 1e21 ? `${(rate / 1e21).toFixed(2)} ZH/s` : `${Math.round(rate / 1e18)} EH/s`, cx, 470 * u);
    ctx.fillStyle = C.amberText; ctx.font = P.font(600, 34 * u, P.MONO);
    ctx.fillText(spelled(rate), cx, 560 * u);
    ctx.fillText(`hashes a second ≈ 2^${Math.round(Math.log2(rate))}`, cx, 610 * u);
    ctx.fillStyle = v ? "#4fd08a" : C.grey; ctx.font = P.font(600, 30 * u, P.MONO);
    ctx.fillText(v ? CH.freshness(reader.status("hashrate"), reader.at("hashrate"), now) : `${BAKED.when} · ${reader.status("hashrate")}`, cx, 690 * u);
  };

  // ---------- its door ----------
  // A museum's gallery doors: dark green lacquer leaves with brass-lined panels and brass push and kick plates, between
  // stone pilasters under a cornice.
  const door = {
    casing: "#d8d2c4", frame: "#3a2a1a", header: "#2a2420", word: "#d4a63a", strip: null, chain: false,
    leaf: "#1f3a2e", seam: "#0e1c16", plate: "#2a2420", face: "#d4a63a", mark: "#2a2420",
    leafFace(side, H) {
      const brass = "#b08a3a", panel = (x0, y0, x1, y1) => {
        H.rect(x0, y0, x1, y0 + 0.02, brass, 0.15, 1); H.rect(x0, y1 - 0.02, x1, y1, brass, 0.15, 1);
        H.rect(x0, y0, x0 + 0.02, y1, brass, 0.15, 1); H.rect(x1 - 0.02, y0, x1, y1, brass, 0.15, 1);
      };
      panel(-0.55, 0.45, 0.55, 1.45); panel(-0.55, 1.7, 0.55, 2.95);
      H.rect(H.inner + side * 0.06, 1.05, H.inner + side * 0.16, 1.45, "#d4a63a", 0.25, 2);
      H.rect(-0.75, 0.04, 0.75, 0.28, brass, 0.15, 1);
    }
  };
  const doorTrim = (K, L) => {
    const d = RM.doorway(L), z = d.Z - 0.14, x = d.W + d.F + 0.14;
    for (const sx of [-1, 1]) {
      K.box(0.22, d.head - 0.3, 0.16, "#cfc8b8", sx * x, (d.head - 0.3) / 2 + 0.15, z);
      K.box(0.3, 0.15, 0.2, "#bdb6a6", sx * x, 0.075, z);
      K.box(0.3, 0.15, 0.2, "#bdb6a6", sx * x, d.head - 0.075, z);
    }
    K.box(2 * x + 0.5, 0.14, 0.3, "#cfc8b8", 0, d.head + 0.07, d.Z - 0.15);
  };

  const plan = (K, L) => {
    doorTrim(K, L);
    const e0 = ROOMS.edgeEl(L, 0) / P.DEG, lo = e0 + 6, hi = e0 + 42, elOf = (lg) => lo + (lg - 6) / 16 * (hi - lo);
    K.wallColor("#1c1d22");
    K.render({ sky: [0.52, 0.5, 0.48], ground: [0.22, 0.2, 0.18], ambientFloor: 0.42, bloomStrength: 0.55 });
    // The dome: the hashrate chart round the room, eras shaded, units over the door, years along its foot.
    K.dome((ctx, D) => {
      D.sky(ctx, [[90, "#0a0b0f"], [0, "#0e0f13"]]);
      const X = (yr) => D.x(azOf(yr)), base = D.y(lo);
      for (const [, a, b, color] of ERAS) { ctx.fillStyle = color; ctx.fillRect(X(a), D.y(hi + 4), X(b) - X(a), base - D.y(hi + 4)); }
      for (const [name, a, b] of ERAS) D.pixText(ctx, name, azOf((a + b) / 2), hi + 2, name === "ASIC" ? 1.3 : 0.8, "rgba(255,230,190,.9)");
      for (const [lg, unit] of UNITS) {
        ctx.fillStyle = "rgba(255,255,255,.1)"; ctx.fillRect(0, D.y(elOf(lg)) - 1, D.W, 2);
        for (const az of [180, -40, 60]) D.text(ctx, unit, az, elOf(lg) + 1.2, 0.69, "rgba(200,200,210,.75)", 600, D.MONO);
      }
      // The history from the chart's start to its end, filled down to its foot and traced in amber.
      const points = [[START, HISTORY[0][1]], ...HISTORY, [END, HISTORY[HISTORY.length - 1][1]]];
      const trace = () => { ctx.beginPath(); points.forEach(([yr, lg], i) => { const x = X(yr), y = D.y(elOf(lg)); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }); };
      trace(); ctx.lineTo(X(END), base); ctx.lineTo(X(START), base); ctx.closePath(); ctx.fillStyle = "rgba(247,147,26,.08)"; ctx.fill();
      trace(); ctx.strokeStyle = C.amber; ctx.lineWidth = 5; ctx.lineJoin = "round"; ctx.stroke();
      for (let yr = START; yr <= 2026; yr++) {
        ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.fillRect(X(yr) - 1, base, 2, 10);
        if (yr % 2) D.text(ctx, String(yr), azOf(yr), lo - 2.2, 0.74, C.grey, 600, D.MONO);
      }
      D.text(ctx, "about 5 MH/s", azOf(START) + 1, elOf(6.74) + 4.5, 0.92, C.white, 700, D.FONT, "left");
      D.text(ctx, "about 1 ZH/s · 2026", azOf(END) - 1, elOf(21.01) + 3.5, 1, C.amberText, 700, D.FONT, "right");
      D.text(ctx, "NETWORK HASHRATE · LOG SCALE · 14 ORDERS OF MAGNITUDE", 0, hi + 9, 0.85, C.white, 700);
      D.text(ctx, "five-week averages of mempool.space's daily estimates · approximate", 0, hi + 6.6, 0.45, C.grey, 500);
    });
    // The crown stands well inside the dome, so Canvas 2D's face sort keeps it in front of the dome's own faces.
    K.live({ cap: true, el0: hi + 13, inset: 0.97, w: CROWN, h: CROWN, tip: "The network's hashrate today",
      key: (f) => { const v = f.reader.value("hashrate"); return `${f.reader.status("hashrate")}|${v ? v.current : ""}|${f.reader.at("hashrate")}`; },
      paint: (ctx, f, now) => paintCrown(ctx, f.reader, now) });
    // The exhibits' ring: plinths `rx` out, the amber ring on the floor `ringR` out with a dot and the year at each.
    const rx = L.r0 - 3.4, ringR = rx - 1.9;
    K.floor((ctx, F) => {
      ctx.fillStyle = "#1f1c19"; ctx.fillRect(0, 0, F.N, F.N);
      ctx.strokeStyle = "#2c2824"; ctx.lineWidth = 3;
      for (let v = -1.2 * Math.ceil(F.rf / 1.2); v < F.rf; v += 1.2) {
        ctx.beginPath(); ctx.moveTo(F.X(v), 0); ctx.lineTo(F.X(v), F.N); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, F.Y(v)); ctx.lineTo(F.N, F.Y(v)); ctx.stroke();
      }
      ctx.strokeStyle = C.amber; ctx.lineWidth = 0.08 * F.s; ctx.beginPath(); ctx.arc(F.X(0), F.Y(0), ringR * F.s, 0, P.TAU); ctx.stroke();
      F.path(0, L.doorZ, 0, ringR + 0.1);
      MINERS.forEach((ex, i) => {
        const a = AZ[i] * P.DEG, sx = Math.sin(a), sz = -Math.cos(a);
        ctx.fillStyle = C.amber; ctx.beginPath(); ctx.arc(F.X(sx * ringR), F.Y(sz * ringR), 0.16 * F.s, 0, P.TAU); ctx.fill();
        // The year, reading from inside the ring toward its exhibit.
        ctx.save(); ctx.translate(F.X(sx * (ringR - 0.7)), F.Y(sz * (ringR - 0.7))); ctx.rotate(a);
        P.pix(ctx, String(Math.floor(ex.year)), 0, 0, 0.36 * F.s, C.amberText);
        ctx.restore();
      });
    });
    // The exhibits: plinth, model, the plaque on its post to the plinth's right as seen from the middle.
    const cards = plaques();
    MINERS.forEach((ex, i) => {
      const a = AZ[i] * P.DEG, x = rx * Math.sin(a), z = -rx * Math.cos(a), g = K.group(x, 0, z, headingTo(x, z, 0, 0));
      const target = { kind: "exhibit", tip: `${Math.floor(ex.year)} · ${ex.name} · tap to see it up close`, radius: 0.95, index: i };
      g.node(null, plinth(), 0, 0, 0, { target });
      model(g, ex.model, 1, TOP + 0.005);
      g.box(0.08, 0.88, 0.08, C.post, -1.25, 0.44, -0.25);
      g.node(null, cards[i], -1.25, 0.98, -0.3, { ry: Math.PI, rx: -0.55, glow: true, target });
      g.solid({ x: -0.57, z: -0.05, hx: 1.2, hz: 0.66 });
    });
    // The middle: a round plinth with an amber ring, its sign toward the doors, and a big S21 turning on it.
    K.cyl(1.2, 1.3, TOP, C.stone, 0, TOP / 2, 0, { seg: 48 });
    K.torus(1.2, 0.03, C.amber, 0, TOP, 0, { emissive: 1, glow: true, seg: 64 });
    K.picture(1.6, 0.5, 1000, 310, paintSign, 0, 0.55, 1.29, { rx: -0.1, target: { kind: "sign", tip: "One S21 against the 2012 network", radius: 0.9, data: { say: "One S21 (200 TH/s) outhashes the whole 2012 network (~16 TH/s) about 13 times over" } } });
    K.node("turntable", (k) => model(k, "s21", BIG, 0), 0, TOP + 0.005, 0, { target: { kind: "exhibit", tip: "Antminer S21 · tap to see it up close", radius: 1.2, index: 8 } });
    K.solid({ x: 0, z: 0, r: 1.38 });
    // Two benches either side of the middle, facing the turning S21, each seating two.
    for (const side of [-1, 1]) {
      const b = K.group(side * 4.5, 0, 0, -side * Math.PI / 2);
      const seats = [-0.55, 0.55].map((x) => b.seat(x, 0, 0, 0.46, 0, 1.3));
      b.node(null, (k) => {
        k.box(2, 0.08, 0.5, "#4a3a2c", 0, 0.42, 0);
        for (const x of [-0.85, 0.85]) k.box(0.1, 0.38, 0.42, "#2a2420", x, 0.19, 0);
        k.box(1.9, 0.02, 0.03, C.amber, 0, 0.36, 0.26, { emissive: 0.7 });
      }, 0, 0, 0, { target: { kind: "chair", tip: "Bench", radius: 1, index: seats[0].index } });
      b.solid({ x: 0, z: 0, hx: 1.05, hz: 0.3 });
    }
    // Point lights: the turntable's spot, the exhibits round the ring, the dome's wash.
    K.light(0, 5.5, 0, 14, 1, 0.94, 0.86);
    for (const az of [-150, -102, -30, 36, 108, 146]) K.light(9.2 * Math.sin(az * P.DEG), 3.8, -9.2 * Math.cos(az * P.DEG), 8, 0.78, 0.7, 0.6);
    K.light(0, 9, -5, 22, 0.5, 0.46, 0.42);
  };

  // What moves: the big S21 turning. A tap on an exhibit, or Space in front of one, opens it in the model viewer: the
  // machine up close in 3D beside all its stats, paged in date order.
  const animate = (nodes, built) => {
    const turntable = nodes.turntable, rx = built.layout.r0 - 3.4;
    const spots = MINERS.map((ex, i) => ({ x: rx * Math.sin(AZ[i] * P.DEG), z: -rx * Math.cos(AZ[i] * P.DEG) }));
    const look = (i) => BL.modelViewer.open({
      title: "Mining Museum", count: MINERS.length, index: i,
      help: matchMedia("(pointer: coarse)").matches ? "Drag to turn it · pinch to zoom · the arrows for the next machine" : "Drag to turn it · scroll to zoom · ← → for the next machine",
      item: (n) => {
        const ex = MINERS[n];
        return { kicker: `${Math.floor(ex.year)} · ${ex.title}`, name: ex.name, text: ex.about, stats: ex.specs, note: ex.note, links: ex.sources, geometry: viewModel()[n] };
      }
    });
    // Space's action: the nearest exhibit within reach and in front of the Ooga, or the turning S21 in the middle.
    const acts = MINERS.map((ex, i) => ({ key: `look${i}`, label: "LOOK", hint: `Space · Look at the ${ex.name} up close`, tap: "Tap LOOK to see it up close", run: () => look(i) }));
    const middle = { key: "look-middle", label: "LOOK", hint: "Space · Look at the Antminer S21 up close", tap: "Tap LOOK to see it up close", run: () => look(8) };
    let act = null, best = 0;
    const consider = (a, ax, az, reach, x, z, fx, fz) => {
      const dx = ax - x, dz = az - z, d = Math.hypot(dx, dz), f = Math.hypot(fx, fz) || 1;
      if (d < reach && d < best && (dx * fx + dz * fz) / (d * f) > 0.2) { act = a; best = d; }
    };
    return {
      update(dt) { turntable.rotation.y += dt * 0.35; },
      near(x, z, fx, fz) {
        act = null; best = Infinity;
        for (let i = 0; i < spots.length; i++) consider(acts[i], spots[i].x, spots[i].z, 2.4, x, z, fx, fz);
        consider(middle, 0, 0, 2.8, x, z, fx, fz);
        return act;
      },
      tap(owner) {
        if (owner.kind !== "exhibit") return false;
        look(owner.index);
        return true;
      }
    };
  };
  BL.timechainRoomKinds.mining = { plan, animate, door };
})();
