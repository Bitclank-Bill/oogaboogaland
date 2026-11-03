// Genesis museum: a Bitcoin Guide essay laid out as printed pages, for the reading portal (scene-genesis.js openEssay),
// the same shape as the whitepaper's strip (whitepaper-pages-data.js): pages one under another with a gap of dark
// stone between them, so the portal's reader scrolls, turns pages and zooms an essay exactly as it does the paper.
// `paint(canvas, essay, aspect, limit)` sizes the canvas and paints it once, returning { width, height, page, gap,
// count } (the strip's doc). Pages are `aspect` (height / width) of their width; a strip taller than `limit` pixels is
// laid out narrower. The text is the essay's own (genesis-guide-data.js), its heading, paragraphs and bullet points.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const PAPER = "#f7f2e7", INK = "#1d1a16", SOFT = "#5c5448", STONE = "#15120e";
  const SERIF = "Georgia, 'Times New Roman', serif";
  // The essay's text as lines on pages at width W: returns the pages, each a list of [kind, text, y].
  const layout = (g, e, W, P) => {
    const m = W * 0.1, inner = W - 2 * m, body = W * 0.024, lead = body * 1.5, pages = [];
    let page = [], y = m;
    const next = () => { pages.push(page); page = []; y = m; };
    const put = (kind, text, size, gapAfter) => {
      g.font = kind === "h" ? `bold ${size}px ${SERIF}` : kind === "t" ? `bold ${size}px ${SERIF}` : `${size}px ${SERIF}`;
      const words = text.split(/\s+/), rows = [];
      let row = "";
      const width = kind === "b" ? inner - body * 1.4 : inner;
      for (const w of words) { const t = row ? `${row} ${w}` : w; if (g.measureText(t).width > width && row) { rows.push(row); row = w; } else row = t; }
      if (row) rows.push(row);
      const step = size * 1.45;
      if (kind === "h" && y + step * (rows.length + 2) > P - m) next();
      rows.forEach((r, i) => {
        if (y + step > P - m * 0.9) next();
        page.push([kind, r, y, size, i === 0]);
        y += step;
      });
      y += gapAfter;
    };
    put("t", e.title, W * 0.052, body);
    put("s", e.description, body * 1.05, lead * 1.2);
    for (const [k, t] of e.text) {
      if (k === "h") put("h", t, body * 1.25, body * 0.4);
      else put(k === "b" ? "b" : "p", t, body, body * 0.7);
    }
    if (page.length) pages.push(page);
    return pages;
  };
  const paint = (canvas, essay, aspect, limit) => {
    const g = canvas.getContext("2d");
    let W = 1100, pages, P;
    for (let tries = 0; tries < 6; tries++) {
      P = Math.round(W * aspect);
      pages = layout(g, essay, W, P);
      const H = pages.length * P + (pages.length - 1) * Math.round(W * 0.03);
      if (H <= limit) break;
      W = Math.floor(W * Math.sqrt(limit / H) * 0.98);
    }
    const gap = Math.round(W * 0.03), H = pages.length * P + (pages.length - 1) * gap;
    canvas.width = W; canvas.height = H;
    g.fillStyle = STONE; g.fillRect(0, 0, W, H);
    const ink = essay.accent === "#000000" ? "#3a3f48" : essay.accent, m = W * 0.1;
    pages.forEach((rows, n) => {
      const top = n * (P + gap);
      g.fillStyle = PAPER; g.fillRect(0, top, W, P);
      g.fillStyle = ink; g.fillRect(0, top, W, W * 0.012);
      g.textBaseline = "top"; g.textAlign = "left";
      for (const [kind, text, y, size, first] of rows) {
        g.font = kind === "h" || kind === "t" ? `bold ${size}px ${SERIF}` : kind === "s" ? `italic ${size}px ${SERIF}` : `${size}px ${SERIF}`;
        g.fillStyle = kind === "t" ? ink : kind === "s" ? SOFT : INK;
        const x = kind === "b" ? m + size * 1.4 : m;
        if (kind === "b" && first) { g.fillStyle = ink; g.fillText("•", m + size * 0.2, top + y); g.fillStyle = INK; }
        g.fillText(text, x, top + y);
      }
      g.font = `${Math.round(W * 0.016)}px ${SERIF}`; g.fillStyle = SOFT; g.textAlign = "center";
      g.fillText(`${essay.title} · bitcoinguide.app · ${n + 1} of ${pages.length}`, W / 2, top + P - m * 0.6);
    });
    return { width: W, height: H, page: P, gap, count: pages.length };
  };
  BL.genesisEssayStrip = { paint };
})();
