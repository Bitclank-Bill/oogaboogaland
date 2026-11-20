// A revision's face index and PNG move together. The app never loads the island's renderer.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {}, listeners = new Set(), canvases = new Map();
  const HASH = /^[a-f0-9]{64}$/;
  let faces = BL.oogaChatFaces, path = "art/ooga-faces.png", sheet = null, revision = "embedded", generation = 0;
  let read = null, pending = false, readAt = 0;
  const changed = () => { for (const fn of listeners) fn(); };
  const apply = (body) => {
    const m = body?.portraits, cast = body?.cast;
    if (!m || !Array.isArray(cast) || cast.length > 128 || !HASH.test(m.revision) || !HASH.test(m.image)
      || m.version !== 1 || m.size !== 80 || m.columns !== 8 || m.fallback !== cast.length
      || m.rows !== Math.ceil((cast.length + 1) / 8) || !m.cells || typeof m.cells !== "object" || Array.isArray(m.cells)
      || !Number.isSafeInteger(body.catalogGeneration) || body.catalogGeneration <= 0 || body.catalogRevision !== m.revision) return false;
    const names = cast.map((row) => String(row?.handle || "").toLowerCase()).sort();
    if (Object.keys(m.cells).length !== names.length || new Set(names).size !== names.length
      || names.some((name, i) => !/^[a-z0-9-]{1,39}$/.test(name) || !Object.hasOwn(m.cells, name) || m.cells[name] !== i)) return false;
    if (faces.baseline === m.baseline && body.catalogGeneration < generation) return false;
    if (m.revision === revision) { generation = body.catalogGeneration; return true; }
    faces = m; generation = body.catalogGeneration; revision = m.revision;
    path = `/api/chat/public/portraits/${m.revision}/${m.image}.png`;
    sheet = null; canvases.clear(); changed(); return true;
  };
  const refresh = () => {
    if (!read || pending || Date.now() - readAt < 120000) return;
    pending = true; readAt = Date.now();
    Promise.resolve().then(read).then(apply, () => {}).finally(() => { pending = false; });
  };
  const canvas = (name) => {
    refresh();
    const requested = String(name).toLowerCase(), key = Object.hasOwn(faces.cells, requested) ? requested : " ";
    if (canvases.has(key)) return canvases.get(key);
    if (!sheet) {
      const image = sheet = new Image();
      image.addEventListener("load", () => { if (sheet === image) changed(); }, { once: true });
      image.src = path;
    }
    if (!sheet.complete || !sheet.naturalWidth || sheet.naturalWidth !== faces.columns * faces.size
      || faces.rows && sheet.naturalHeight !== faces.rows * faces.size) return null;
    const i = faces.cells[key] ?? faces.fallback, size = faces.size, out = document.createElement("canvas");
    out.width = out.height = size;
    out.getContext("2d").drawImage(sheet, (i % faces.columns) * size, Math.floor(i / faces.columns) * size, size, size, 0, 0, size, size);
    canvases.set(key, out); return out;
  };
  BL.oogaChatPortraits = { apply, canvas, configure(fn) { read = fn; },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }, get revision() { return revision; } };
})();
