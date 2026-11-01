// The Genesis museum's exhibit workbench, its pure half (no DOM, renderer or audio), so Node can check it. The
// workbench is one broad window: on the left a clear stage through which the visitor sees the exhibit's own model,
// framed by the camera, with the command input, Run, Reset and the exhibit's own actions under it; on the right the
// explanation, how to use it, the deeper story and its sources; Previous and Next walk the exhibits in date order.
// Owned by the workbench builder (docs/genesis-voyage/OVERHAUL-CONTRACT.md); genesis-workbench.js uses it.
//
// - `actionsFrom(lines)`: the commands an exhibit's HELP lists, as buttons: { cmd, arg } (`arg` true when the command
//   takes words after it, so the button fills the input instead of running). HELP, MORE, SOURCES and RESET are left
//   out (the workbench shows the story and sources itself and has its own Reset); at most MAX_ACTIONS.
// - `sections({ banner, more, howTo, hint, pages })`: the right column's sections, each { title, lines }, with no
//   line repeated: how it connects, in short, how to use, the deeper story (a board's pages instead, for a panel).
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const MAX_ACTIONS = 8, SKIP = new Set(["HELP", "MORE", "SOURCES", "RESET", "CLS"]);
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
  BL.genesisBench = { MAX_ACTIONS, actionsFrom, sections };
})();
