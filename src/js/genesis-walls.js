// The Genesis museum's gallery walls: one exhibition board high on each era's back wall, above the exhibits, with
// that era's press and posters (Billy's request, gv/ovh-polish).
//
// - Clippings are real headlines quoted word for word with their publication and date, typeset for the museum in the
//   page's own type (no scans, no mastheads); `src` is where the wording was checked. A headline that could not be
//   verified is left out rather than guessed.
// - Posters and artworks are museum originals in each era's style (invented titles, no real film, artist or design
//   copied), each captioned as such. Real public-domain pieces can replace them once the session can fetch images.
//
// `BL.genesisWalls`: { ERAS, layout(rect, out, opts), paintBoard(g, W, H, era, eraInfo), BOARD }.
// `layout` is pure (Node checks it): where a gallery's board hangs on its back wall and which way it faces.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  // The board in metres, and its picture.
  const BOARD = { w: 18, h: 5.6, y: 7.2, inset: 0.7, px: 2048 };
  const ERAS = [
    { clippings: [
        { paper: "The New York Times", date: "5 October 1957", head: "SOVIET FIRES EARTH SATELLITE INTO SPACE", sub: "It Is Circling the Globe at 18,000 M.P.H.", src: "https://wewerethere.journalism.columbia.edu/news/1957-sputnik" },
        { paper: "The New York Times", date: "21 July 1969", head: "MEN WALK ON MOON", sub: "Astronauts Land on Plain; Collect Rocks, Plant Flag", src: "https://wewerethere.journalism.columbia.edu/news/1969-moon-landing" }],
      poster: { style: "bmovie", title: "THE THINKING MACHINE", kicker: "FROM BEYOND THE PUNCH CARD!", tag: "IT COUNTS FASTER THAN A THOUSAND MEN!", note: "in the style of 1950s science-fiction film posters" },
      art: { style: "op", note: "in the style of 1960s op art" } },
    { clippings: [
        { paper: "The News and Observer, Raleigh", date: "16 August 1971", head: "Nixon Freezes Wages and Prices", sub: "Proposes Cuts In Income Tax", src: "https://www.rarenewspapers.com/view/618082" },
        { paper: "Scientific American", date: "August 1977", head: "A new kind of cipher that would take millions of years to break", sub: "Mathematical Games, by Martin Gardner", kind: "magazine", src: "https://www2.math.upenn.edu/~kazdan/210S19/Notes/crypto/Gardner-RSA-1977.pdf" }],
      poster: { style: "seventies", title: "TWO KEYS", kicker: "ONE LOCK. NO SECRET SHARED.", tag: "NOW SHOWING ON A TERMINAL NEAR YOU", note: "in the style of 1970s thriller posters" },
      art: { style: "supergraphic", note: "in the style of 1970s supergraphics" } },
    { clippings: [
        { paper: "Time", date: "3 January 1983", head: "Machine of the Year: The Computer Moves In", sub: "Cover story by Jay Cocks", kind: "magazine", src: "https://content.time.com/time/specials/2007/article/0,28804,1704183_1704257_1704498,00.html" },
        { paper: "The New York Times", date: "20 October 1987", head: "STOCKS PLUNGE 508 POINTS, A DROP OF 22.6%", sub: "604 Million Volume Nearly Doubles Record", src: "https://elischolar.library.yale.edu/ypfs-documents/8227" }],
      poster: { style: "neon", title: "HASH RUNNER", kicker: "ONE CHANGE. EVERY ROOT KNOWS.", tag: "IN COLOUR ON EVERY SCREEN", note: "in the style of 1980s neon film posters" },
      art: { style: "memphis", note: "in the style of 1980s Memphis design" } },
    { clippings: [
        { paper: "Wired", date: "May/June 1993, issue 1.02", head: "Crypto Rebels", sub: "by Steven Levy", kind: "magazine", src: "https://blockworks.co/news/cypherpunk-movement-history-wired-1993" },
        { paper: "The New York Times Magazine", date: "12 June 1994", head: "The Cypherpunks vs. Uncle Sam", sub: "Battle of the Clipper Chip, by Steven Levy", kind: "magazine", src: "https://cypherpunks.venona.com/date/1994/06/msg00515.html" }],
      poster: { style: "zine", title: "CYPHERPUNKS WRITE CODE", kicker: "A Cypherpunk's Manifesto, Eric Hughes, 1993", tag: "PHOTOCOPY AND PASS IT ON", note: "a flyer in the style of early-1990s photocopied zines, quoting the manifesto" },
      art: { style: "fractal", note: "in the style of early-1990s computer art" } },
    { clippings: [
        { paper: "The New York Times", date: "12 May 1997", head: "Swift and Slashing, Computer Topples Kasparov", sub: "by Bruce Weber", src: "https://afflictor.com/?p=89414" }],
      poster: { style: "y2k", title: "MILLENNIUM BUG", kicker: "12:00:00 · 01.01.00", tag: "IS YOUR CLOCK READY?", note: "in the style of late-1990s techno-thriller posters" },
      art: { style: "chrome", note: "in the style of late-1990s chrome and blob graphics" } },
    { clippings: [
        { paper: "Honolulu Star-Bulletin, wire report", date: "9 March 2000", head: "Nasdaq explodes past 5,000", src: "https://archives.starbulletin.com/2000/03/09/business/market.html" },
        { paper: "CNBC", date: "14 September 2007", head: "Bank of England Offers Aid to Lender Northern Rock", kind: "web", src: "https://www.cnbc.com/2007/09/14/bank-of-england-offers-aid-to-lender-northern-rock.html" }],
      poster: { style: "indie", title: "PEER TO PEER", kicker: "EVERYONE HAS A PIECE", tag: "SHARE THE WHOLE THING", note: "in the style of 2000s indie film posters" },
      art: { style: "gloss", note: "in the style of 2000s glossy web graphics" } },
    { clippings: [
        { paper: "The New York Times", date: "15 September 2008", head: "Lehman Files for Bankruptcy; Merrill Is Sold", sub: "by Andrew Ross Sorkin", src: "https://www.bloomberg.com/news/articles/2008-09-15/tectonic-shift-on-wall-street-as-lehman-fails-merrill-sold" }],
      poster: { style: "constructivist", title: "BE YOUR OWN BANK", kicker: "PEER · TO · PEER · CASH", tag: "NO TRUSTED THIRD PARTY", note: "in the style of 1920s constructivist posters, made for the museum" },
      art: { style: "stencil", note: "in the style of 2000s stencil street art" } },
    { clippings: [
        { paper: "The Times", date: "3 January 2009", head: "Chancellor on brink of second bailout for banks", sub: "Billions may be needed as lending squeeze tightens · Francis Elliott and Gary Duncan", src: "https://www.calculatedriskblog.com/2009/01/uk-another-round-of-bailouts-for-banks.html" }],
      poster: { style: "swiss", title: "BLOCK 0", kicker: "3 JANUARY 2009", tag: "50 BTC · THE FIRST BLOCK", note: "in the style of Swiss typographic posters" },
      art: { style: "pixels", note: "in the style of pixel art" } }
  ];

  // Where a gallery's board hangs: centred on its back wall (the side `out` points to, a unit vector along x or z),
  // `inset` in from it, facing back into the gallery. `ry` turns a face that looks along +z to look that way.
  const layout = (r, out, { inset = BOARD.inset } = {}) => {
    const cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2;
    if (out.x < -0.5) return { x: r.x0 + inset, z: cz, ry: Math.PI / 2, wall: r.z1 - r.z0 };
    if (out.x > 0.5) return { x: r.x1 - inset, z: cz, ry: -Math.PI / 2, wall: r.z1 - r.z0 };
    if (out.z < -0.5) return { x: cx, z: r.z0 + inset, ry: 0, wall: r.x1 - r.x0 };
    return { x: cx, z: r.z1 - inset, ry: Math.PI, wall: r.x1 - r.x0 };
  };

  // --- Painting -----------------------------------------------------------------------------------------------------
  const SERIF = "Georgia, 'Times New Roman', serif", SANS = "system-ui, 'Helvetica Neue', Arial, sans-serif";
  // A seeded generator, so a board paints the same every visit.
  const rng = (seed) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  // Lines of `text` that fit `width` at the current font.
  const wrap = (g, text, width) => {
    const words = String(text).split(" "), lines = [];
    let line = "";
    for (const w of words) { const t = line ? `${line} ${w}` : w; if (g.measureText(t).width > width && line) { lines.push(line); line = w; } else line = t; }
    if (line) lines.push(line);
    return lines;
  };
  // The largest font size (from `max` down) at which `text` fits `width` in at most `rows` lines.
  const fit = (g, text, font, max, min, width, rows) => {
    for (let s = max; s >= min; s -= 2) { g.font = font(s); const l = wrap(g, text, width); if (l.length <= rows && l.every((t) => g.measureText(t).width <= width)) return { size: s, lines: l }; }
    g.font = font(min); return { size: min, lines: wrap(g, text, width) };
  };

  const clipping = (g, x, y, w, h, c, seed) => {
    const r = rng(seed);
    g.fillStyle = c.kind === "web" ? "#f4f6f8" : c.kind === "magazine" ? "#f3eee4" : "#ece5d3"; g.fillRect(x, y, w, h);
    // Age: a slightly darker edge.
    g.fillStyle = "rgba(120,96,50,0.10)"; g.fillRect(x, y, w, 6); g.fillRect(x, y + h - 6, w, 6); g.fillRect(x, y, 6, h); g.fillRect(x + w - 6, y, 6, h);
    const pad = 22, iw = w - pad * 2;
    g.fillStyle = "#1a1714"; g.textAlign = "center"; g.textBaseline = "alphabetic";
    // The publication's name in plain type (never its masthead), a rule, the date.
    const name = fit(g, c.paper, (s) => `bold ${s}px ${SERIF}`, 34, 16, iw, 1);
    g.font = `bold ${name.size}px ${SERIF}`; g.fillText(name.lines[0], x + w / 2, y + pad + name.size);
    let cy = y + pad + name.size + 12;
    g.fillRect(x + pad, cy, iw, 3); cy += 26;
    g.font = `italic 19px ${SERIF}`; g.fillText(c.date, x + w / 2, cy); cy += 12;
    g.fillRect(x + pad, cy, iw, 1.5); cy += 18;
    // The headline, as large as fits.
    const head = fit(g, c.head, (s) => `bold ${s}px ${SERIF}`, 48, 20, iw, 4);
    g.font = `bold ${head.size}px ${SERIF}`;
    for (const l of head.lines) { cy += head.size * 1.08; g.fillText(l, x + w / 2, cy); }
    if (c.sub) {
      const sub = fit(g, c.sub, (s) => `${s}px ${SERIF}`, 24, 15, iw, 3);
      g.font = `${sub.size}px ${SERIF}`; cy += 12;
      for (const l of sub.lines) { cy += sub.size * 1.2; g.fillText(l, x + w / 2, cy); }
    }
    // Columns of greyed text (bars, not words), to the foot.
    cy += 24;
    const cols = 3, gw = (iw - 24) / cols;
    for (let k = 0; k < cols; k++) for (let ly = cy; ly < y + h - pad; ly += 13) {
      const len = gw * (ly + 13 >= y + h - pad || r() < 0.08 ? 0.4 + r() * 0.4 : 0.92 + r() * 0.08);
      g.fillStyle = "rgba(40,34,28,0.28)"; g.fillRect(x + pad + k * (gw + 12), ly, len, 5);
    }
  };

  const POSTERS = {
    bmovie(g, x, y, w, h, p) {
      const grd = g.createLinearGradient(0, y, 0, y + h); grd.addColorStop(0, "#14204a"); grd.addColorStop(1, "#c4381c"); g.fillStyle = grd; g.fillRect(x, y, w, h);
      for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(255,255,220,0.8)"; g.fillRect(x + ((i * 97) % w), y + ((i * 53) % (h * 0.45)), 3, 3); }
      // A rocket and a giant counting machine with blinking lamps.
      g.fillStyle = "#e7e2d0"; g.beginPath(); g.moveTo(x + w * 0.72, y + h * 0.18); g.lineTo(x + w * 0.8, y + h * 0.34); g.lineTo(x + w * 0.64, y + h * 0.34); g.closePath(); g.fill(); g.fillRect(x + w * 0.66, y + h * 0.34, w * 0.12, h * 0.12);
      g.fillStyle = "#f2a91c"; g.beginPath(); g.moveTo(x + w * 0.67, y + h * 0.46); g.lineTo(x + w * 0.72, y + h * 0.56); g.lineTo(x + w * 0.77, y + h * 0.46); g.fill();
      g.fillStyle = "#2b2b2b"; g.fillRect(x + w * 0.12, y + h * 0.4, w * 0.42, h * 0.3);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { g.fillStyle = (i + j) % 2 ? "#ff4a2a" : "#ffe36a"; g.beginPath(); g.arc(x + w * (0.18 + i * 0.09), y + h * (0.46 + j * 0.07), 7, 0, 7); g.fill(); }
      g.fillStyle = "#ffd23a"; g.textAlign = "center";
      const t = fit(g, p.title, (s) => `900 ${s}px ${SANS}`, 64, 24, w - 30, 2); g.font = `900 ${t.size}px ${SANS}`;
      t.lines.forEach((l, i) => { g.strokeStyle = "#1a0f08"; g.lineWidth = 6; g.strokeText(l, x + w / 2, y + h * 0.8 + i * t.size); g.fillText(l, x + w / 2, y + h * 0.8 + i * t.size); });
      g.fillStyle = "#fff4d0"; g.font = `bold 18px ${SANS}`; g.fillText(p.kicker, x + w / 2, y + 34, w - 20); g.fillText(p.tag, x + w / 2, y + h - 18, w - 20);
    },
    seventies(g, x, y, w, h, p) {
      g.fillStyle = "#2a1a10"; g.fillRect(x, y, w, h);
      const bands = ["#f2c14e", "#f08a24", "#d9532b", "#9b2e2e"];
      bands.forEach((c, i) => { g.fillStyle = c; g.fillRect(x, y + h * (0.32 + i * 0.07), w, h * 0.06); });
      g.fillStyle = "#2a1a10"; g.beginPath(); g.arc(x + w / 2, y + h * 0.42, w * 0.22, 0, 7); g.fill();
      // Two keys crossed.
      g.strokeStyle = "#f2c14e"; g.lineWidth = 8;
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(x + w / 2 - s * w * 0.14, y + h * 0.3); g.lineTo(x + w / 2 + s * w * 0.14, y + h * 0.54); g.stroke(); g.beginPath(); g.arc(x + w / 2 - s * w * 0.15, y + h * 0.29, 14, 0, 7); g.stroke(); }
      g.fillStyle = "#f6e7c8"; g.textAlign = "center";
      const t = fit(g, p.title, (s) => `italic 900 ${s}px ${SERIF}`, 72, 26, w - 30, 2); g.font = `italic 900 ${t.size}px ${SERIF}`;
      t.lines.forEach((l, i) => g.fillText(l, x + w / 2, y + h * 0.78 + i * t.size));
      g.font = `bold 17px ${SANS}`; g.fillText(p.kicker, x + w / 2, y + 36, w - 20); g.font = `15px ${SANS}`; g.fillText(p.tag, x + w / 2, y + h - 18, w - 20);
    },
    neon(g, x, y, w, h, p) {
      g.fillStyle = "#0b0620"; g.fillRect(x, y, w, h);
      const sun = g.createLinearGradient(0, y + h * 0.2, 0, y + h * 0.5); sun.addColorStop(0, "#ffd23a"); sun.addColorStop(1, "#ff2a8a"); g.fillStyle = sun;
      g.beginPath(); g.arc(x + w / 2, y + h * 0.5, w * 0.3, Math.PI, 0); g.fill();
      g.strokeStyle = "#ff3ad0"; g.lineWidth = 2;
      for (let i = 0; i < 9; i++) { const yy = y + h * 0.5 + i * i * 4; g.beginPath(); g.moveTo(x, yy); g.lineTo(x + w, yy); g.stroke(); }
      for (let i = -6; i <= 6; i++) { g.beginPath(); g.moveTo(x + w / 2 + i * 12, y + h * 0.5); g.lineTo(x + w / 2 + i * 70, y + h * 0.82); g.stroke(); }
      g.textAlign = "center"; g.shadowColor = "#3af2ff"; g.shadowBlur = 16; g.fillStyle = "#c9fbff";
      const t = fit(g, p.title, (s) => `italic 900 ${s}px ${SANS}`, 66, 24, w - 30, 2); g.font = `italic 900 ${t.size}px ${SANS}`;
      t.lines.forEach((l, i) => g.fillText(l, x + w / 2, y + h * 0.18 + i * t.size)); g.shadowBlur = 0;
      g.fillStyle = "#ff8ae0"; g.font = `bold 16px ${SANS}`; g.fillText(p.kicker, x + w / 2, y + h * 0.9, w - 20); g.fillStyle = "#c9fbff"; g.fillText(p.tag, x + w / 2, y + h - 14, w - 20);
    },
    zine(g, x, y, w, h, p, seed) {
      const r = rng(seed); g.fillStyle = "#f1f0ea"; g.fillRect(x, y, w, h);
      for (let i = 0; i < 600; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.12})`; g.fillRect(x + r() * w, y + r() * h, 2, 2); }
      // Cut-out letters on tilted scraps.
      g.textAlign = "center"; const words = p.title.split(" ");
      words.forEach((wd, i) => {
        g.save(); g.translate(x + w / 2, y + h * (0.24 + i * 0.18)); g.rotate((r() - 0.5) * 0.16);
        g.fillStyle = i % 2 ? "#111" : "#e8e23a"; g.fillRect(-w * 0.42, -36, w * 0.84, 56);
        g.fillStyle = i % 2 ? "#f1f0ea" : "#111"; const f = fit(g, wd, (s) => `900 ${s}px ${SANS}`, 52, 18, w * 0.78, 1); g.font = `900 ${f.size}px ${SANS}`; g.fillText(wd, 0, 8); g.restore();
      });
      g.fillStyle = "#111"; g.font = `italic 15px ${SERIF}`;
      wrap(g, `"${p.title.charAt(0)}${p.title.slice(1).toLowerCase()}" · ${p.kicker}`, w - 30).forEach((l, i) => g.fillText(l, x + w / 2, y + h * 0.82 + i * 18));
      g.font = `bold 14px ${SANS}`; g.fillText(p.tag, x + w / 2, y + h - 14, w - 20);
    },
    y2k(g, x, y, w, h, p) {
      const grd = g.createRadialGradient(x + w / 2, y + h * 0.42, 10, x + w / 2, y + h * 0.42, w * 0.8); grd.addColorStop(0, "#5ad8ff"); grd.addColorStop(1, "#04122a"); g.fillStyle = grd; g.fillRect(x, y, w, h);
      g.fillStyle = "rgba(10,30,60,0.85)"; g.fillRect(x + w * 0.12, y + h * 0.3, w * 0.76, h * 0.2);
      g.fillStyle = "#ff3a3a"; g.font = `bold 44px 'Courier New', monospace`; g.textAlign = "center"; g.fillText(p.kicker.split(" · ")[0], x + w / 2, y + h * 0.43, w * 0.7);
      g.fillStyle = "#e8f6ff"; g.font = `20px 'Courier New', monospace`; g.fillText(p.kicker.split(" · ")[1] || "", x + w / 2, y + h * 0.48);
      const t = fit(g, p.title, (s) => `900 ${s}px ${SANS}`, 60, 22, w - 30, 2); g.font = `900 ${t.size}px ${SANS}`; g.fillStyle = "#dff4ff";
      t.lines.forEach((l, i) => g.fillText(l, x + w / 2, y + h * 0.7 + i * t.size));
      g.font = `bold 16px ${SANS}`; g.fillText(p.tag, x + w / 2, y + h - 18, w - 20);
    },
    indie(g, x, y, w, h, p) {
      g.fillStyle = "#f7e04a"; g.fillRect(x, y, w, h);
      // Puzzle pieces passed between three figures.
      const cols = ["#ef4b6c", "#2e9bd6", "#3cb46e"];
      for (let i = 0; i < 3; i++) { const px = x + w * (0.2 + i * 0.3); g.fillStyle = "#111"; g.beginPath(); g.arc(px, y + h * 0.3, 18, 0, 7); g.fill(); g.fillRect(px - 16, y + h * 0.3 + 18, 32, 70); g.fillStyle = cols[i]; g.fillRect(px - 14, y + h * 0.52, 28, 28); }
      g.fillStyle = "#111"; g.textAlign = "center";
      const t = fit(g, p.title.toLowerCase(), (s) => `bold ${s}px ${SANS}`, 62, 22, w - 30, 2); g.font = `bold ${t.size}px ${SANS}`;
      t.lines.forEach((l, i) => g.fillText(l, x + w / 2, y + h * 0.78 + i * t.size));
      g.font = `14px ${SANS}`; g.fillText(p.kicker, x + w / 2, y + 30, w - 20); g.fillText(p.tag, x + w / 2, y + h - 16, w - 20);
    },
    constructivist(g, x, y, w, h, p) {
      g.fillStyle = "#efe2c4"; g.fillRect(x, y, w, h);
      g.fillStyle = "#c4161c"; g.beginPath(); g.moveTo(x, y + h * 0.62); g.lineTo(x + w, y + h * 0.18); g.lineTo(x + w, y + h * 0.36); g.lineTo(x, y + h * 0.8); g.closePath(); g.fill();
      g.fillStyle = "#111"; g.beginPath(); g.arc(x + w * 0.3, y + h * 0.3, w * 0.18, 0, 7); g.fill();
      g.fillStyle = "#efe2c4"; g.font = `900 ${Math.round(w * 0.22)}px ${SANS}`; g.textAlign = "center"; g.fillText("₿", x + w * 0.3, y + h * 0.3 + w * 0.08);
      // The title runs along the band's centre line, at its slope.
      g.save(); g.translate(x + w / 2, y + h * 0.49); g.rotate(Math.atan2(-h * 0.44, w)); g.fillStyle = "#efe2c4";
      const t = fit(g, p.title, (s) => `900 ${s}px ${SANS}`, 40, 14, w * 0.95, 1); g.font = `900 ${t.size}px ${SANS}`; g.textBaseline = "middle"; g.fillText(t.lines[0], 0, 0); g.textBaseline = "alphabetic"; g.restore();
      g.fillStyle = "#111"; g.font = `bold 17px ${SANS}`; g.fillText(p.kicker, x + w / 2, y + h * 0.9, w - 20); g.font = `14px ${SANS}`; g.fillText(p.tag, x + w / 2, y + h - 14, w - 20);
    },
    swiss(g, x, y, w, h, p) {
      g.fillStyle = "#f4f2ee"; g.fillRect(x, y, w, h);
      g.fillStyle = "#e42b1e"; g.fillRect(x + w * 0.1, y + h * 0.1, w * 0.8, w * 0.8);
      g.fillStyle = "#f4f2ee"; g.font = `900 ${Math.round(w * 0.5)}px ${SANS}`; g.textAlign = "left"; g.fillText("0", x + w * 0.16, y + h * 0.1 + w * 0.74);
      g.fillStyle = "#111"; g.font = `bold 40px ${SANS}`; g.fillText(p.title, x + w * 0.1, y + h * 0.1 + w * 0.8 + 52, w * 0.8);
      g.font = `20px ${SANS}`; g.fillText(p.kicker, x + w * 0.1, y + h * 0.1 + w * 0.8 + 84, w * 0.8); g.fillText(p.tag, x + w * 0.1, y + h * 0.1 + w * 0.8 + 110, w * 0.8);
    }
  };

  const ART = {
    op(g, x, y, w, h) { g.fillStyle = "#f4f1ea"; g.fillRect(x, y, w, h); for (let i = 0; i < 14; i++) { const s = (14 - i) / 14; g.fillStyle = i % 2 ? "#f4f1ea" : "#111"; g.fillRect(x + w / 2 - w * s / 2 + Math.sin(i * 0.5) * 8, y + h / 2 - h * s / 2, w * s, h * s); } },
    supergraphic(g, x, y, w, h) { g.fillStyle = "#f3e6c8"; g.fillRect(x, y, w, h); const c = ["#5b3a1e", "#c25a1c", "#e89a2a", "#f2c14e"]; g.lineWidth = w * 0.07; c.forEach((col, i) => { g.strokeStyle = col; g.beginPath(); g.arc(x, y + h, w * (0.4 + i * 0.11), -Math.PI / 2, 0); g.stroke(); }); },
    memphis(g, x, y, w, h, s) { const r = rng(s); g.fillStyle = "#fff3f8"; g.fillRect(x, y, w, h); const cols = ["#ff5fa2", "#3ad0ff", "#ffd23a", "#111", "#2fd18a"]; for (let i = 0; i < 26; i++) { g.fillStyle = cols[i % 5]; g.strokeStyle = cols[(i + 2) % 5]; g.lineWidth = 5; const px = x + r() * w, py = y + r() * h, k = r(); if (k < 0.3) { g.beginPath(); g.arc(px, py, 10 + r() * 20, 0, 7); g.fill(); } else if (k < 0.6) { g.save(); g.translate(px, py); g.rotate(r() * 3); g.fillRect(-20, -6, 40, 12); g.restore(); } else { g.beginPath(); g.moveTo(px, py); for (let j = 1; j < 6; j++) g.lineTo(px + j * 12, py + (j % 2 ? -10 : 10)); g.stroke(); } } },
    fractal(g, x, y, w, h) { g.fillStyle = "#06040f"; g.fillRect(x, y, w, h); for (let py = 0; py < h; py += 4) for (let px = 0; px < w; px += 4) { let zr = 0, zi = 0, n = 0; const cr = -2.1 + (px / w) * 2.8, ci = -1.2 + (py / h) * 2.4; while (n < 40 && zr * zr + zi * zi < 4) { const t = zr * zr - zi * zi + cr; zi = 2 * zr * zi + ci; zr = t; n++; } if (n < 40) { g.fillStyle = `hsl(${(n * 9 + 200) % 360},90%,${20 + n}%)`; g.fillRect(x + px, y + py, 4, 4); } } },
    chrome(g, x, y, w, h) { const bg = g.createLinearGradient(x, y, x + w, y + h); bg.addColorStop(0, "#1b2a6b"); bg.addColorStop(1, "#7fd3ff"); g.fillStyle = bg; g.fillRect(x, y, w, h); for (let i = 0; i < 3; i++) { const cx = x + w * (0.3 + i * 0.22), cy = y + h * (0.35 + (i % 2) * 0.3), rr = w * 0.16; const gr = g.createRadialGradient(cx - rr * 0.3, cy - rr * 0.3, 2, cx, cy, rr); gr.addColorStop(0, "#ffffff"); gr.addColorStop(0.5, "#a9b4c2"); gr.addColorStop(1, "#3b4552"); g.fillStyle = gr; g.beginPath(); g.ellipse(cx, cy, rr, rr * 0.8, i, 0, 7); g.fill(); } },
    gloss(g, x, y, w, h) { g.fillStyle = "#eaf6ff"; g.fillRect(x, y, w, h); const cols = ["#ff7a1a", "#7ac943", "#29abe2", "#ef3b8c"]; cols.forEach((c, i) => { const cx = x + w * (0.25 + (i % 2) * 0.5), cy = y + h * (0.3 + Math.floor(i / 2) * 0.4), rr = w * 0.17; g.fillStyle = c; g.beginPath(); g.arc(cx, cy, rr, 0, 7); g.fill(); const hl = g.createLinearGradient(0, cy - rr, 0, cy); hl.addColorStop(0, "rgba(255,255,255,0.75)"); hl.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = hl; g.beginPath(); g.ellipse(cx, cy - rr * 0.45, rr * 0.75, rr * 0.45, 0, 0, 7); g.fill(); }); },
    stencil(g, x, y, w, h, s) { const r = rng(s); g.fillStyle = "#8f8b84"; g.fillRect(x, y, w, h); for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.08})`; g.fillRect(x + r() * w, y + r() * h, 6, 6); } g.fillStyle = "#111"; g.font = `900 ${Math.round(h * 0.42)}px ${SANS}`; g.textAlign = "center"; g.fillText("₿", x + w / 2, y + h * 0.6); g.fillStyle = "#c4161c"; g.fillRect(x + w * 0.18, y + h * 0.74, w * 0.64, 14); g.fillStyle = "#111"; g.font = `bold 22px ${SANS}`; g.fillText("CAN'T STOP IT", x + w / 2, y + h * 0.88, w * 0.8); },
    pixels(g, x, y, w, h, s) { const r = rng(s); g.fillStyle = "#101418"; g.fillRect(x, y, w, h); const n = 12, cw = w / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const v = r(); g.fillStyle = v < 0.5 ? "#1b2a33" : v < 0.8 ? "#f7931a" : "#ffd27a"; g.fillRect(x + i * cw + 2, y + j * (h / n) + 2, cw - 4, h / n - 4); } }
  };

  // A board: a dark backing, a header, and the era's pieces left to right (poster, clippings and art alternate),
  // each in a frame with its caption under it.
  // A board's pieces, left to right (poster, clippings and art alternate), and where each stands on a W x H board:
  // `x`, `w` in pixels, all at the same `top` and height `ph`. Pure, so the scene can find the piece a tap points at.
  const piecesOf = (n) => {
    const d = ERAS[n], pieces = [];
    pieces.push({ type: "poster", d: d.poster, aspect: 2 / 3 });
    if (d.clippings[0]) pieces.push({ type: "clip", d: d.clippings[0], aspect: 0.82 });
    pieces.push({ type: "art", d: d.art, aspect: 1 });
    if (d.clippings[1]) pieces.push({ type: "clip", d: d.clippings[1], aspect: 0.82 });
    return pieces;
  };
  const slots = (n, W, H) => {
    const pieces = piecesOf(n), top = 74, capH = 64, ph = H - top - capH - 14, widths = pieces.map((p) => Math.round(ph * p.aspect));
    const gap = Math.max(40, (W - widths.reduce((a, b) => a + b, 0)) / (pieces.length + 1));
    let x = gap;
    return { top, ph, pieces: pieces.map((p, i) => { const s = { ...p, x, w: widths[i] }; x += widths[i] + gap; return s; }) };
  };
  // One piece drawn into (x, y, w, h), clipped to it.
  const drawPiece = (g, x, y, w, h, n, i, p) => {
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    if (p.type === "clip") clipping(g, x, y, w, h, p.d, 31 * n + i);
    else if (p.type === "poster") POSTERS[p.d.style](g, x, y, w, h, p.d, 17 * n + i);
    else ART[p.d.style](g, x, y, w, h, 13 * n + i);
    g.restore();
  };
  // What a piece is and where it comes from: its caption's two lines, and for a clipping the page its wording was
  // checked against.
  const pieceInfo = (n, i) => {
    const p = piecesOf(n)[i];
    return p.type === "clip"
      ? { type: p.type, line1: `${p.d.paper} · ${p.d.date}`, line2: "headline as published, typeset for the museum", head: p.d.head, src: p.d.src }
      : { type: p.type, line1: "MUSEUM ORIGINAL", line2: p.d.note, head: p.type === "poster" ? p.d.title : "", src: "" };
  };
  // A piece up close (the board dialog): redrawn at `k` times its size on the board, so its type stays sharp.
  const BASE_PH = 485;
  const paintPiece = (canvas, n, i, k = 2.6) => {
    const p = piecesOf(n)[i], w = Math.round(BASE_PH * p.aspect), pad = 18;
    canvas.width = Math.round((w + pad * 2) * k); canvas.height = Math.round((BASE_PH + pad * 2) * k);
    const g = canvas.getContext("2d");
    g.setTransform(k, 0, 0, k, 0, 0);
    g.fillStyle = "#0d0b09"; g.fillRect(0, 0, w + pad * 2, BASE_PH + pad * 2);
    g.fillStyle = p.type === "clip" ? "#6b5a44" : "#b58a3a"; g.fillRect(pad - 8, pad - 8, w + 16, BASE_PH + 16);
    drawPiece(g, pad, pad, w, BASE_PH, n, i, p);
    g.setTransform(1, 0, 0, 1, 0, 0);
    return p.type;
  };
  const paintBoard = (g, W, H, n, info) => {
    const L = slots(n, W, H);
    g.fillStyle = "#1f1a15"; g.fillRect(0, 0, W, H);
    g.fillStyle = "#3a2f24"; g.fillRect(0, 0, W, 6); g.fillRect(0, H - 6, W, 6);
    g.fillStyle = "#e9d9b0"; g.textAlign = "left"; g.textBaseline = "alphabetic"; g.font = `bold 30px ${SANS}`;
    g.fillText(`ERA ${n} · ${String(info.name).toUpperCase()} · ON THE PAGES AND THE WALLS OF ${String(info.years).replace(/-/g, "–").toUpperCase()}`, 34, 46, W - 68);
    L.pieces.forEach((p, i) => {
      const { x, w } = p, y = L.top, ph = L.ph;
      g.fillStyle = "#0d0b09"; g.fillRect(x - 14, y - 14, w + 28, ph + 28);
      g.fillStyle = p.type === "clip" ? "#6b5a44" : "#b58a3a"; g.fillRect(x - 8, y - 8, w + 16, ph + 16);
      drawPiece(g, x, y, w, ph, n, i, p);
      // The caption: what it is and where it comes from.
      const info2 = pieceInfo(n, i);
      g.textAlign = "center"; g.fillStyle = "#e9d9b0"; g.font = `bold 19px ${SANS}`;
      g.fillText(info2.line1, x + w / 2, y + ph + 34, w + 60); g.font = `16px ${SANS}`; g.fillStyle = "#bfae88"; g.fillText(info2.line2, x + w / 2, y + ph + 56, w + 60);
    });
    return L.pieces.length;
  };
  BL.genesisWalls = { ERAS, BOARD, layout, paintBoard, piecesOf, slots, pieceInfo, paintPiece };
})();
