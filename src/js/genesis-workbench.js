// The Genesis museum's exhibit workbench: one broad window for every exhibit (docs/genesis-voyage/OVERHAUL-CONTRACT.md,
// v1). Owned by the workbench builder; this is the seed moved out of the gv/museum prototype at the interface freeze.
//
// `BL.genesisWorkbench.create(host, root)` → { show(id), hide(), get isOpen(), resize(), dispose() }
//   host   the scene's host object (contract §5): session, run, stage, close, open, sourceOf, view
//   root   the workbench's section in index.html (#genesis-bench, between the genesis-workbench markers)
//
// Left: a clear stage through which the visitor sees the exhibit's own world model (the host frames the camera on it
// from `host.stage(rect)`), with the command line, Run, Reset and the exhibit's own commands under it. Right: how it
// connects, in short, how to use, the deeper story and the sources (genesis-bench.js `sections`, no line repeated).
// Previous and Next walk the catalogue's date order through `host.open(id, "browse")`. Close and Escape call
// `host.close()`; Take me there calls `host.close({ there: true })`. No sound and no motion of its own. A historical
// system (anything but a modern museum game) is a display: no prompt; it runs its own demonstration a step at a time.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const MAX_OUT = 120;
  const create = (host, root) => {
    const GN = BL.genesisBench, ac = new AbortController(), signal = ac.signal;
    const $ = (id) => root.querySelector(`#genesis-bench-${id}`);
    const el = { kicker: $("kicker"), title: $("title"), pos: $("pos"), stage: $("stage"), form: $("form"), input: $("input"), prompt: $("prompt"),
      actions: $("actions"), output: $("output"), info: $("info"), note: $("panel-note"), close: root.querySelector("[data-bench=close]") };
    const COARSE = matchMedia("(pointer: coarse)").matches;
    let id = null, term = null, board = null, open = false, display = false, timer = 0, stepAt = 0, steps = [];
    const lines = [];
    const write = (node, tag, text, cls) => { const n = document.createElement(tag); n.textContent = text; if (cls) n.className = cls; node.append(n); return n; };
    const report = () => host.stage(open ? el.stage.getBoundingClientRect() : null);
    const fillInfo = (e) => {
      const info = el.info;
      info.replaceChildren();
      let more = [];
      if (term) { const r = host.run(id, "MORE"); more = (r && r.lines) || []; }
      for (const sec of GN.sections({ banner: term ? term.banner : [], more, howTo: [], hint: e.hint, pages: board ? board.pages : null })) {
        write(info, "h3", sec.title);
        const box = sec.title === "How it connects" ? write(info, "div", "", "bench-connects") : info;
        for (const line of sec.lines) write(box, "p", line);
      }
      const keys = [...new Set([...e.sources.map((s) => s.key), ...((board && board.sources) || [])])];
      if (keys.length) {
        write(info, "h3", "Sources");
        const ul = write(info, "ul", "");
        for (const k of keys) {
          const src = host.sourceOf(k), li = document.createElement("li");
          if (src && src.href) { const a = document.createElement("a"); a.href = src.href; a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = src.label || src.href; li.append(a); }
          else li.textContent = k;
          ul.append(li);
        }
      }
      info.scrollTop = 0;
    };
    const fillActions = () => {
      el.actions.replaceChildren();
      if (!term) return;
      const help = (host.run(id, "HELP") || {}).lines || [];
      for (const a of GN.actionsFrom(help)) {
        const b = document.createElement("button");
        b.type = "button"; b.textContent = a.arg ? `${a.cmd} …` : a.cmd; b.dataset.cmd = a.cmd; b.dataset.arg = a.arg ? "1" : "";
        b.title = a.arg ? `Type ${a.cmd} and what goes after it` : `Run ${a.cmd}`;
        el.actions.append(b);
      }
    };
    const run = (line) => {
      if (!term || !String(line).trim()) return null;
      const out = host.run(id, line) || { lines: [] };
      if (out.cls) lines.length = 0;
      else lines.push(`${term.prompt} ${String(line).trim().toUpperCase()}`, ...(out.lines || []));
      if (lines.length > MAX_OUT) lines.splice(0, lines.length - MAX_OUT);
      el.output.textContent = lines.join("\n");
      el.output.scrollTop = el.output.scrollHeight;
      return out;
    };
    // A display: the exhibit runs itself (genesis-autoplay.js's demonstration, through its own terminal) a step every
    // STEP_MS, the replies in the output, and starts again after a pause. Only the museum's games take typing.
    const STEP_MS = 2600, LOOP_MS = 6000;
    const stopDisplay = () => { if (timer) clearTimeout(timer); timer = 0; };
    const tick = () => {
      timer = 0;
      if (!open || !display) return;
      if (stepAt < steps.length) { run(steps[stepAt++]); timer = setTimeout(tick, STEP_MS); return; }
      run("RESET"); lines.length = 0; el.output.textContent = "Starting again…"; stepAt = 0;
      timer = setTimeout(tick, LOOP_MS - STEP_MS);
    };
    const show = (next) => {
      const s = host.session(next);
      if (!s) return false;
      stopDisplay();
      const e = s.entry, n = host.catalogue.entries.length;
      id = next; term = s.terminal; board = s.board; lines.length = 0; open = true;
      display = !!term && e.modern !== "game" && !!BL.genesisAutoplay;
      el.kicker.textContent = `Era ${e.era} · ${e.eraName} · ${e.year}${e.connection !== "context" ? ` · ${e.connectionLabel}${e.ref ? ` ${e.ref}` : ""}` : ""}`;
      el.title.textContent = e.title;
      el.pos.textContent = `${e.index + 1} of ${n}`;
      el.form.hidden = !term || display; el.output.hidden = !term; el.note.hidden = !!term && !display;
      el.prompt.textContent = term ? term.prompt : ">";
      el.output.textContent = !term ? "" : display ? "This exhibit runs itself: watch the model above, each step explained here." : "Type a command, or use a button. Watch the model above.";
      el.input.value = "";
      el.note.textContent = s.caption || (display ? "A working display of the idea: it runs on its own. Read the story on the right." : "This exhibit is a panel: read it on the right. Its model is live above.");
      if (s.caption) el.note.hidden = false;
      fillActions(); fillInfo(e);
      el.actions.hidden = display;
      if (display) { steps = BL.genesisAutoplay.script(term, null, id); stepAt = 0; timer = setTimeout(tick, 1200); }
      root.hidden = false;
      document.body.classList.add("genesis-bench-open");
      report();
      if (term && !display && !COARSE) el.input.focus(); else el.close.focus();
      return true;
    };
    const hide = () => {
      if (!open) return;
      stopDisplay(); display = false;
      open = false; id = term = board = null;
      root.hidden = true;
      document.body.classList.remove("genesis-bench-open");
      if (document.activeElement && root.contains(document.activeElement)) document.activeElement.blur();
    };
    const browse = (by) => { const e = by > 0 ? host.catalogue.next(id) : host.catalogue.prev(id); if (e) host.open(e.id, "browse"); };
    el.form.addEventListener("submit", (e) => { e.preventDefault(); run(el.input.value); el.input.value = ""; }, { signal });
    root.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b || !open) return;
      if (b.dataset.bench === "close") host.close();
      else if (b.dataset.bench === "go") host.close({ there: true });
      else if (b.dataset.bench === "prev") browse(-1);
      else if (b.dataset.bench === "next") browse(1);
      else if (b.dataset.bench === "reset") run("RESET");
      else if (b.dataset.cmd) {
        if (b.dataset.arg) { el.input.value = `${b.dataset.cmd} `; el.input.focus(); }
        else run(b.dataset.cmd);
      }
    }, { signal });
    root.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); host.close(); }
      else if (e.target !== el.input && (e.key === "ArrowRight" || e.key === "ArrowLeft")) { e.preventDefault(); browse(e.key === "ArrowRight" ? 1 : -1); }
    }, { signal });
    return {
      show, hide, get isOpen() { return open; }, get id() { return id; },
      resize: () => { if (open) report(); },
      run, dispose: () => { hide(); ac.abort(); }
    };
  };
  BL.genesisWorkbench = { create };
})();
