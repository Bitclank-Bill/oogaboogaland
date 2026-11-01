// The Genesis museum's exhibit workbench, its pure half (no DOM, renderer or audio), so Node can check it. The
// workbench is one broad window: on the left a clear stage through which the visitor sees the exhibit's own model,
// framed by the camera, with the command input, Run, Reset and the exhibit's own actions under it; on the right the
// explanation, how to use it, the deeper story and its sources; Previous and Next walk the exhibits in date order.
// scene-genesis.js opens it, frames the model and wires the input.
//
// - `order(entries)`: the exhibits in date order ({ def: { year }, era, order }), the year first (a decade such as
//   "1980s" just after its first year, genesis-exhibits.js yearKey), then era, then build order. Returns a new array.
// - `actionsFrom(lines)`: the commands an exhibit's HELP lists, as buttons: { cmd, arg } (`arg` true when the command
//   takes words after it, so the button fills the input instead of running). HELP, MORE, SOURCES and RESET are left
//   out (the workbench shows the story and sources itself and has its own Reset); at most MAX_ACTIONS.
// - `sections({ banner, more, howTo, hint, pages })`: the right column's sections, each { title, lines }, with no
//   line repeated: how it connects, in short, how to use, the deeper story (a board's pages instead, for a panel).
// - `frame(view, out)`: where the camera stands and looks so the model's centre lands in the middle of the stage
//   (`ndc`, the stage's centre in -1..1 screen units) at about `fill` of the stage's height (`frac` of the screen).
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const MAX_ACTIONS = 8, MAX_DIST = 14, SKIP = new Set(["HELP", "MORE", "SOURCES", "RESET", "CLS"]);
  const yearKey = (year) => typeof year === "number" ? year : +String(year).match(/\d{4}/)[0] + 0.5;
  const order = (entries) => entries.slice().sort((a, b) => yearKey(a.def.year) - yearKey(b.def.year) || a.era - b.era || a.order - b.order);
  // A HELP line names a command at its start in capitals ("SEARCH", "TARGET 4..12", "PING G1", "DIR A:"), then its
  // arguments, if any (capital words or <placeholders>, numbers), then a description in lower case.
  const actionsFrom = (lines) => {
    const out = [], seen = new Set();
    for (const raw of lines || []) {
      const line = String(raw).replace(/^\s*(HINT:|Commands:|\d+\.)\s*/, "").trim();
      for (const part of line.split(/\s*\|\s*/)) {
        const m = part.match(/^([A-Z][A-Z0-9]{1,11})((?:\s+(?:<[^>]+>|[A-Z0-9:.]+(?:\.\.[0-9]+)?|[a-z]))*)(?=\s|$)/);
        if (!m || SKIP.has(m[1]) || seen.has(m[1])) continue;
        // A lowercase word straight after the command is an argument placeholder ("FETCH peer", "EDIT text").
        const arg = m[2].trim().length > 0 || /^[A-Z][A-Z0-9]+\s+[a-z]+(\s|$)/.test(part) && !/^[A-Z][A-Z0-9]+\s{2,}/.test(part);
        seen.add(m[1]);
        out.push({ cmd: m[1], arg });
        if (out.length >= MAX_ACTIONS) return out;
      }
    }
    return out;
  };
  const clean = (lines) => (lines || []).map((l) => String(l).trim()).filter((l) => l && !/^type help\.?$/i.test(l));
  const sections = ({ banner = [], more = [], howTo = [], hint = "", pages = null }) => {
    const seen = new Set(), out = [];
    const add = (title, lines) => {
      const kept = [];
      for (const l of clean(lines)) if (!seen.has(l)) { seen.add(l); kept.push(l); }
      if (kept.length) out.push({ title, lines: kept });
    };
    const b = clean(banner), connects = [], short = [], steps = [];
    // A banner's "HOW TO USE" block (its numbered steps), a HINT line, "Commands:" and bare command lists ("A | B | C")
    // are how to use it or the buttons' business, not the story.
    let inSteps = false;
    for (let i = 0; i < b.length; i++) {
      const line = b[i];
      if (/^HOW IT CONNECTS:/.test(line) || (i > 0 && /^HOW IT CONNECTS:/.test(b[i - 1]) && /Steps toward Bitcoin|story of these years|not a step of its own|Listed in the paper/.test(line))) { connects.push(line.replace(/^HOW IT CONNECTS:\s*/, "")); continue; }
      if (/^HOW TO USE:?$/.test(line)) { inSteps = true; continue; }
      if (inSteps && /^\d+\.\s/.test(line)) { steps.push(line.replace(/^\d+\.\s*/, "")); continue; }
      inSteps = false;
      if (/^HINT:/.test(line)) { steps.unshift(line.replace(/^HINT:\s*/, "")); continue; }
      const parts = line.split(/\s\|\s/);
      if (/^Commands:/.test(line) || (parts.length > 1 && parts.every((x) => /^[A-Z][A-Z0-9]+/.test(x.trim())))) continue;
      short.push(line);
    }
    add("How it connects", connects);
    if (pages) {
      for (const p of pages) add(p.caption && p.title ? `${p.caption}: ${p.title}` : p.title || p.caption || "", p.text);
      return out;
    }
    add("In short", short);
    add("How to use", [...(hint ? [hint] : []), ...howTo, ...steps]);
    add("The deeper story", more);
    return out;
  };
  // view: { c: {x,y,z} the model's centre, size (its largest extent), toward: {x,z} the direction to stand back in,
  // ndc: {x,y}, frac (the stage's height as a share of the screen), fov (vertical, radians, as scene.js cameras keep
  // it), aspect, fill, pitch }. The camera stays within MAX_DIST of the model, so it never backs through a wall.
  const frame = (v, out) => {
    const tanV = Math.tan(v.fov / 2), tanH = tanV * v.aspect, fill = v.fill || 0.6, pitch = v.pitch === undefined ? 0.2 : v.pitch;
    const dist = Math.max(2.2, Math.min(MAX_DIST, v.size / (fill * v.frac * 2 * tanV)));
    const tl = Math.hypot(v.toward.x, v.toward.z) || 1, tx = v.toward.x / tl, tz = v.toward.z / tl;
    const ex = v.c.x + tx * dist * Math.cos(pitch), ey = v.c.y + dist * Math.sin(pitch), ez = v.c.z + tz * dist * Math.cos(pitch);
    // The camera's right and up (looking from the eye at the centre); shifting the target the other way moves the
    // model to the stage's place on screen.
    out.eye.x = ex; out.eye.y = ey; out.eye.z = ez;
    out.target.x = v.c.x; out.target.y = v.c.y; out.target.z = v.c.z;
    // Shift the target until the model's centre projects onto the stage's centre (a few passes; each is exact for
    // small turns, so the error shrinks fast). Right = forward x world up; up = right x forward.
    for (let pass = 0; pass < 6; pass++) {
      const fx = out.target.x - ex, fy = out.target.y - ey, fz = out.target.z - ez, fl = Math.hypot(fx, fy, fz), nx = fx / fl, ny = fy / fl, nz = fz / fl;
      const rl = Math.hypot(nz, nx) || 1, rx = -nz / rl, rz = nx / rl;
      const ux = -rz * ny, uy = rz * nx - rx * nz, uz = rx * ny;
      const dx = v.c.x - ex, dy = v.c.y - ey, dz = v.c.z - ez, depth = dx * nx + dy * ny + dz * nz;
      const px = (dx * rx + dz * rz) / depth / tanH, py = (dx * ux + dy * uy + dz * uz) / depth / tanV;
      const ex2 = v.ndc.x - px, ey2 = v.ndc.y - py;
      if (Math.abs(ex2) < 1e-4 && Math.abs(ey2) < 1e-4) break;
      out.target.x -= rx * ex2 * tanH * fl + ux * ey2 * tanV * fl; out.target.y -= uy * ey2 * tanV * fl; out.target.z -= rz * ex2 * tanH * fl + uz * ey2 * tanV * fl;
    }
    out.dist = dist;
    return out;
  };
  BL.genesisBench = { MAX_ACTIONS, MAX_DIST, order, actionsFrom, sections, frame, yearKey };
})();
