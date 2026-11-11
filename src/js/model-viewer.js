// A dialog that shows a model up close, beside what there is to know about it: the model drawn by the HUD's icon
// renderer (Canvas 2D, so it looks the same on either renderer) on a canvas the visitor turns by dragging, zooms with
// the wheel or a pinch, or works with the keys; its kicker, name, account, stats, note and sources; paged through a set
// with the arrows. `open({ title, help, count, index, item(i) })`, an item being { kicker, name, text, stats: [[label,
// value]], note, links: [{ href, label }], geometry }. It draws only when something changes, never on a timer, and
// holds nothing once closed but the last model's geometry, which its owner caches anyway.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const { createNode, addChild } = BL.scene;
  // The view: the camera's turn round the model and its tilt (radians), how far in it is zoomed, and their limits;
  // a drag of one CSS pixel turns it TURN radians; the camera's field of view.
  const START = { yaw: -0.4, pitch: 0.3, zoom: 1 }, PITCH = [-0.2, 1.25], ZOOM = [0.6, 2.6], TURN = 0.009, FOV = 0.62;
  const view = { ...START };
  const root = createNode(), shown = createNode();
  addChild(root, shown);
  const camera = { position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, up: { x: 0, y: 1, z: 0 }, fov: FOV, near: 0.02, far: 100, aspect: 1 };
  const middle = { x: 0, y: 0, z: 0 };
  let els = null, set = null, index = 0, renderer = null, width = 0, height = 0, pending = 0, radius = 1;
  const pointers = new Map();
  let pinch = 0;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  // The model's middle and how far round it reaches, so it fills the canvas whatever its size.
  const frame = (geometry) => {
    const v = geometry.verts;
    let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
    for (let i = 0; i < v.length; i += 3) {
      if (v[i] < x0) x0 = v[i]; if (v[i] > x1) x1 = v[i];
      if (v[i + 1] < y0) y0 = v[i + 1]; if (v[i + 1] > y1) y1 = v[i + 1];
      if (v[i + 2] < z0) z0 = v[i + 2]; if (v[i + 2] > z1) z1 = v[i + 2];
    }
    middle.x = (x0 + x1) / 2; middle.y = (y0 + y1) / 2; middle.z = (z0 + z1) / 2;
    radius = Math.max(0.05, Math.hypot(x1 - x0, y1 - y0, z1 - z0) / 2);
  };
  // A canvas the size it is shown at, and a renderer for it; made again only when that size changes.
  const fit = () => {
    const w = Math.max(1, Math.round(els.canvas.clientWidth)), h = Math.max(1, Math.round(els.canvas.clientHeight));
    if (w === width && h === height && renderer) return;
    width = w; height = h;
    renderer = BL.iconRenderer.createRenderer(els.canvas, { width, height });
  };
  const paint = () => {
    pending = 0;
    if (!els || !els.dialog.open || !shown.geometry) return;
    fit();
    const d = radius / Math.sin(FOV / 2) * 0.94 / view.zoom, c = Math.cos(view.pitch);
    camera.aspect = width / height;
    camera.target.x = middle.x; camera.target.y = middle.y; camera.target.z = middle.z;
    camera.position.x = middle.x + Math.sin(view.yaw) * c * d;
    camera.position.y = middle.y + Math.sin(view.pitch) * d;
    camera.position.z = middle.z - Math.cos(view.yaw) * c * d;
    renderer.render(root, camera);
  };
  const redraw = () => { if (!pending) pending = requestAnimationFrame(paint); };
  // One item into the dialog: the model, and its words as text (never markup).
  const show = (i) => {
    index = (i + set.count) % set.count;
    const item = set.item(index);
    shown.geometry = item.geometry;
    frame(item.geometry);
    Object.assign(view, START);
    els.kicker.textContent = item.kicker || "";
    els.name.textContent = item.name;
    els.text.textContent = item.text || "";
    els.canvas.setAttribute("aria-label", `${item.name}, in 3D: drag to turn it`);
    const rows = [];
    for (const [label, value] of item.stats || []) {
      const dt = document.createElement("dt"), dd = document.createElement("dd");
      dt.textContent = label; dd.textContent = value;
      rows.push(dt, dd);
    }
    els.stats.replaceChildren(...rows);
    els.note.textContent = item.note || "";
    els.note.hidden = !item.note;
    const links = (item.links || []).map((l) => {
      const a = document.createElement("a");
      a.className = "board-link"; a.href = l.href; a.textContent = l.label; a.target = "_blank"; a.rel = "noopener noreferrer";
      return a;
    });
    els.links.replaceChildren(...links);
    els.links.hidden = !links.length;
    els.count.textContent = `${index + 1} / ${set.count}`;
    els.prev.disabled = els.next.disabled = set.count < 2;
    redraw();
  };
  const turn = (dx, dy) => { view.yaw += dx; view.pitch = clamp(view.pitch + dy, PITCH[0], PITCH[1]); redraw(); };
  const zoom = (k) => { view.zoom = clamp(view.zoom * k, ZOOM[0], ZOOM[1]); redraw(); };
  // The dialog's own wiring, made the first time it opens.
  const wire = () => {
    const $ = (id) => document.getElementById(id);
    els = { dialog: $("model-modal"), title: $("model-title"), canvas: $("model-canvas"), kicker: $("model-kicker"), name: $("model-name"), text: $("model-text"),
      stats: $("model-stats"), note: $("model-note"), links: $("model-links"), count: $("model-count"), prev: $("model-prev"), next: $("model-next"), help: $("model-help"), close: $("model-close") };
    const c = els.canvas;
    c.addEventListener("pointerdown", (e) => { c.setPointerCapture(e.pointerId); pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); pinch = 0; });
    c.addEventListener("pointermove", (e) => {
      const p = pointers.get(e.pointerId);
      if (!p) return;
      if (pointers.size === 1) turn((e.clientX - p.x) * TURN, (e.clientY - p.y) * TURN);
      p.x = e.clientX; p.y = e.clientY;
      if (pointers.size === 2) {
        const [a, b] = pointers.values(), d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch) zoom(d / pinch);
        pinch = d;
      }
    });
    const lift = (e) => { pointers.delete(e.pointerId); pinch = 0; };
    c.addEventListener("pointerup", lift);
    c.addEventListener("pointercancel", lift);
    c.addEventListener("wheel", (e) => { e.preventDefault(); zoom(Math.exp(-e.deltaY * 0.0015)); }, { passive: false });
    els.prev.addEventListener("click", () => show(index - 1));
    els.next.addEventListener("click", () => show(index + 1));
    els.close.addEventListener("click", () => els.dialog.close());
    // A press on the backdrop, outside the dialog's box, closes it (as `hud.dismissOutside` does for the HUD's own).
    els.dialog.addEventListener("pointerdown", (e) => {
      const r = els.dialog.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) els.dialog.close();
    });
    els.dialog.addEventListener("keydown", (e) => {
      if (e.target.closest("a, button") && (e.key === "Enter" || e.key === " ")) return;
      const k = e.key.toLowerCase();
      if (k === "arrowleft" || k === "arrowright") show(index + (k === "arrowleft" ? -1 : 1));
      else if (k === "a" || k === "d") turn(k === "a" ? -0.26 : 0.26, 0);
      else if (k === "w" || k === "s" || k === "arrowup" || k === "arrowdown") turn(0, k === "w" || k === "arrowup" ? 0.15 : -0.15);
      else if (k === "+" || k === "=" || k === "-") zoom(k === "-" ? 1 / 1.2 : 1.2);
      else if (k === "r") { Object.assign(view, START); redraw(); }
      else return;
      e.preventDefault();
    });
    els.dialog.addEventListener("close", () => { pointers.clear(); if (pending) cancelAnimationFrame(pending); pending = 0; set = null; });
    window.addEventListener("resize", () => { if (els.dialog.open) redraw(); });
  };
  const open = (next) => {
    if (!els) wire();
    set = next;
    els.title.textContent = next.title;
    els.help.textContent = next.help || "Drag to turn it · scroll or pinch to zoom · ← → for the next one";
    if (document.pointerLockElement) document.exitPointerLock();
    if (!els.dialog.open) els.dialog.showModal();
    show(next.index || 0);
    els.canvas.focus({ preventScroll: true });
  };
  BL.modelViewer = {
    open,
    close: () => { if (els && els.dialog.open) els.dialog.close(); },
    get stats() { return { open: !!(els && els.dialog.open), index, width, height, view: { ...view } }; }
  };
})();
