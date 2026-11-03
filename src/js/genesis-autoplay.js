// Genesis museum: exhibits that run themselves. A terminal exhibit (one whose use opens a typed prompt) plays a short
// demonstration on its own while a visitor stands at it: the steps its own banner tells a visitor to type ("Type MAP
// and press Enter"), else a walk through the commands its HELP lists with sensible arguments, each step's reply shown
// in the "Now running" panel, so nobody has to learn a strange old system's commands to see it work. The exhibit's
// visuals follow, since the steps go through its own terminal. The workbench still takes typing for anyone who wants
// to. `script` is pure (Node checks every terminal's), `create` drives one exhibit at a time from the scene.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const REFUSED = /^\s*(unknown command|not understood|unrecogni[sz]ed)/i;
  const STEP = 2.6, LINGER = 5, MAX_STEPS = 9, SKIP = /^(HELP|MORE|SOURCES|RESET|QUIT|EXIT|CLEAR|BACK|INFO)$/;
  // An argument spec from HELP made concrete: a number range, a list, a cell range, a word, a count; `k` picks a
  // different value for a second run of the same command.
  const argFor = (spec, k) => {
    let m;
    if ((m = /^\(?(-?\d+)\.\.(-?\d+)\)?$/.exec(spec))) { const a = +m[1], b = +m[2]; return String(Math.round(a + (b - a) * (k ? 0.75 : 0.35))); }
    if ((m = /\((-?\d+)\.\.(-?\d+)/.exec(spec))) { const a = +m[1], b = +m[2]; return String(Math.round(a + (b - a) * (k ? 0.75 : 0.35))); }
    if ((m = /\(([A-Z])(\d)\.\.([A-Z])(\d)\)/.exec(spec))) return k ? `${m[3]}${m[4]}` : `${String.fromCharCode((m[1].charCodeAt(0) + m[3].charCodeAt(0)) >> 1)}${(+m[2] + +m[4]) >> 1}`;
    if ((m = /\(([^()]*,[^()]*)\)/.exec(spec))) { const opts = m[1].split(/\s*,\s*/); return opts[Math.min(opts.length - 1, k)]; }
    if (/^<n>$|^n$|count|number|amount|^<\w+>$/i.test(spec)) return String(k + 1);
    if (/letters|text|word|message|name/i.test(spec)) return k ? "BLOCK" : "OOGA";
    if (/^[A-Z0-9][A-Z0-9-]*$/.test(spec)) return spec;
    return null;
  };
  // The steps a banner tells a visitor to type: "Type MAP", "Type PING G1 and PING G2", "then SEND".
  const fromBanner = (banner) => {
    const out = [];
    for (const line of banner) {
      const re = /\b(?:[Tt]ype|[Tt]ry|then|and)\s+([A-Z][A-Z0-9]*(?:\s+(?:[A-Z0-9][A-Z0-9-]*|\d+))*)/g;
      let m;
      while ((m = re.exec(line))) {
        const cmd = m[1].trim();
        if (cmd.length > 1 && !SKIP.test(cmd.split(/\s+/)[0]) && !out.includes(cmd)) out.push(cmd);
      }
    }
    return out;
  };
  // The commands HELP lists, each with arguments made up for it (twice, with other values, if it takes a range).
  const fromHelp = (help) => {
    const out = [], text = help.join("\n"), entries = text.split(/\s\|\s|\n/).map((s) => s.trim()).filter(Boolean);
    for (const entry of entries) {
      const m = /^([A-Z][A-Z0-9]+)((?:\s+(?:\S+))*?)(?:\s{2,}.*)?$/.exec(entry);
      if (!m || SKIP.test(m[1])) continue;
      // A described argument ("up to 8 letters or digits") is one word of text.
      if (/letters|digits|text|message|words?\b/i.test(m[2]) && !/\.\./.test(m[2])) { out.push(`${m[1]} OOGA`); continue; }
      const specs = m[2].trim() ? m[2].trim().replace(/\s+\(/g, "(").split(/\s+(?![^()]*\))/) : [];
      for (let k = 0; k < (specs.some((s) => /\.\./.test(s)) ? 2 : 1); k++) {
        const args = specs.map((s) => argFor(s, k));
        if (args.some((a) => a === null)) { if (!specs.length) out.push(m[1]); break; }
        out.push([m[1], ...args].join(" "));
      }
    }
    return out;
  };
  // Demonstrations written by hand, for terminals that take keystrokes or sums rather than commands.
  const DEMOS = {
    "e1-paddle": ["S", "UUW", "DDW", "UW", "DDDW", "UUUW"],
    "e1-calc": ["12+30=", "C", "2/3=", "C", "99999999X9=", "C"],
    "e4-pocket": ["E", "E", "S", "S", "E", "LOOK"]
  };
  // A demonstration for one terminal: one written for it, else its banner's own steps, then HELP's commands not
  // already in it.
  const script = (terminal, demo, id) => {
    if (!(demo && demo.length) && id && DEMOS[id]) demo = DEMOS[id];
    if (demo && demo.length) return demo.slice(0, MAX_STEPS);
    const banner = fromBanner(terminal.banner || []);
    let help = [];
    try { help = terminal.run("HELP").lines || []; } catch (err) { help = []; }
    const steps = banner.slice();
    for (const c of fromHelp(help)) if (!steps.some((s) => s.split(" ")[0] === c.split(" ")[0] && banner.length) && !steps.includes(c)) steps.push(c);
    return steps.slice(0, MAX_STEPS);
  };
  // Drives the exhibit the visitor stands at. `show(title, lines)` paints the panel; `hide()` takes it away.
  const create = ({ show, hide }) => {
    const st = { prop: null, term: null, steps: [], i: 0, t: 0, lines: [], title: "", runs: 0 };
    const push = (cmd, reply) => {
      st.lines.push(`> ${cmd}`);
      for (const l of reply) if (String(l).trim()) st.lines.push(String(l));
      if (st.lines.length > 14) st.lines.splice(0, st.lines.length - 14);
      show(st.title, st.lines, st.i, st.steps.length);
    };
    const stop = () => {
      if (st.term) { try { st.term.run("RESET"); } catch (err) { /* a terminal without RESET keeps its state */ } }
      st.prop = st.term = null; st.steps = []; st.lines = [];
      hide();
    };
    const start = (prop, terminal, title) => {
      stop();
      st.prop = prop; st.term = terminal; st.title = title; st.i = 0; st.t = STEP * 0.6; st.lines = [];
      st.steps = script(terminal, prop.demo, prop.id);
      if (!st.steps.length) { st.prop = st.term = null; return false; }
      for (const l of (terminal.banner || []).slice(0, 2)) st.lines.push(String(l));
      show(title, st.lines, 0, st.steps.length);
      return true;
    };
    const update = (dt) => {
      if (!st.term) return;
      st.t -= dt;
      if (st.t > 0) return;
      if (st.i < st.steps.length) {
        const cmd = st.steps[st.i++];
        let reply;
        try { reply = st.term.run(cmd).lines || []; } catch (err) { reply = []; }
        // A step the terminal turns away is left out of the panel, and the next comes at once.
        if (!reply.length || REFUSED.test(reply.join(" "))) { st.t = 0.05; return; }
        push(cmd, reply);
        st.runs++;
        st.t = st.i < st.steps.length ? STEP : LINGER;
      } else {
        // Done: start again from the beginning, as an exhibit on a loop does.
        try { st.term.run("RESET"); } catch (err) { /* see stop */ }
        st.i = 0; st.lines.length = 0; st.t = STEP;
        show(st.title, st.lines, 0, st.steps.length);
      }
    };
    return { start, stop, update, get prop() { return st.prop; }, get runs() { return st.runs; }, state: st };
  };
  BL.genesisAutoplay = { DEMOS, script, fromBanner, fromHelp, argFor, create, STEP };
})();
