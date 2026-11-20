// Saved account equipment, independent of the page's pinned character catalog. Geometry is immutable; a creator's
// new version is an offer, never a silent change to a wearer. Room messages carry appearance, never ownership.
(() => {
  "use strict";
  const BL = window.BL = window.BL || {};
  const HASH = /^[a-f0-9]{64}$/, ITEM = /^[a-z0-9][a-z0-9-]{0,79}$/;
  const EMPTY = Object.freeze({ selection: null, size: 100, revision: 0, declined: null, update: null });
  const state = { supported: false, record: EMPTY, busy: false, error: "" };
  const subscribers = new Set(), remotes = new Map(), applied = new WeakMap(), loading = new Map();
  let account = 0, epoch = 0, reading = null, geometryEpoch = 0, intent = 0;
  const selection = (s) => s === null || !!s && typeof s === "object" && Object.keys(s).length === 2
    && Object.hasOwn(s, "item") && Object.hasOwn(s, "version") && (s.item === "none" ? s.version === null : ITEM.test(s.item) && HASH.test(s.version));
  const validSize = (value) => Number.isInteger(value) && value >= 80 && value <= 120;
  const sizeOf = (value) => Object.hasOwn(value, "size") ? validSize(value.size) ? value.size : null : 100;
  const record = (r) => !!r && selection(r.selection) && Number.isSafeInteger(r.revision) && r.revision >= 0
    && sizeOf(r) !== null
    && (r.declined === null || HASH.test(r.declined)) && (r.update === null || selection(r.update) && r.update.item !== "none"
      && r.selection && r.update.item === r.selection.item && r.update.version !== r.selection.version);
  const emit = () => { notice(); for (const fn of subscribers) fn(state); };
  const adopt = (r) => {
    if (!record(r) || r.revision < state.record.revision) return false;
    state.record = { ...r, size: sizeOf(r) };
    ensure(r.selection);
    return true;
  };
  const ensure = (s) => {
    if (!s || s.item === "none" || BL.equipmentHats.loaded(s.item, s.version)) return Promise.resolve(true);
    if (loading.has(s.version)) return loading.get(s.version);
    // The room holds at most 32 players. Successful immutable reads stay shared and bounded.
    if (loading.size >= 128) return Promise.resolve(false);
    const pending = BL.equipmentHats.load(s.item, s.version).then(() => {
      geometryEpoch++; return true;
    }).catch(() => { loading.delete(s.version); return false; });
    loading.set(s.version, pending);
    return pending;
  };
  const refresh = () => {
    if (!account || !state.supported) return Promise.resolve(false);
    if (reading) return reading;
    const own = epoch;
    const task = (async () => {
      try {
        const response = await fetch("/api/equipment", { credentials: "same-origin", cache: "no-store", signal: AbortSignal.timeout(6000) });
        const data = await response.json();
        if (own !== epoch) return false;
        if (!response.ok || !adopt(data.equipment)) { state.error = "Equipment could not be loaded. Try again."; return false; }
        state.error = "";
        return true;
      } catch { if (own === epoch) state.error = "Equipment could not be loaded. Try again."; return false; }
      finally { if (own === epoch) { reading = null; emit(); } }
    })();
    reading = task;
    return task;
  };
  const write = async (change, revision = state.record.revision) => {
    // A direct choice (including Keep) supersedes any Save still downloading its geometry.
    intent++;
    if (!account || !state.supported || state.busy || revision !== state.record.revision) return false;
    const own = epoch;
    state.busy = true; state.error = ""; emit();
    try {
      const response = await fetch("/api/equipment", { method: "PUT", credentials: "same-origin", cache: "no-store",
        headers: { "content-type": "application/json" }, body: JSON.stringify({ revision, ...change }), signal: AbortSignal.timeout(6000) });
      const data = await response.json();
      if (own !== epoch) return false;
      if (response.status === 409) { adopt(data.equipment); state.error = "Your equipment changed in another tab. Review it and try again."; return false; }
      if (!response.ok || !adopt(data.equipment)) { state.error = "Equipment could not be saved. Try again."; return false; }
      return true;
    } catch { if (own === epoch) state.error = "Equipment could not be saved. Try again."; return false; }
    finally { if (own === epoch) { state.busy = false; emit(); } }
  };
  const save = async (s, size) => {
    if (!account || !state.supported || state.busy || !selection(s) || size !== undefined && !validSize(size)) return false;
    // Keep the user's original CAS revision: a late archive must never save over a newer choice.
    const own = epoch, revision = state.record.revision, ticket = ++intent;
    const loaded = await ensure(s);
    if (own !== epoch || ticket !== intent || revision !== state.record.revision) return false;
    if (!loaded) { state.error = "This hat could not be loaded. Try again."; emit(); return false; }
    return write(size === undefined ? { selection: s } : { selection: s, size }, revision);
  };
  const accept = () => state.record.update ? save(state.record.update) : Promise.resolve(false);
  const decline = () => state.record.update ? write({ decline: state.record.update.version }) : Promise.resolve(false);
  const receive = (msg) => {
    if (!state.supported || !msg || msg.t !== "equipment") return;
    if (msg.kind === "snapshot") {
      if (!Array.isArray(msg.rows) || msg.rows.length > 32) return;
      const next = new Map();
      for (const row of msg.rows) {
        if (!row || !Number.isSafeInteger(row.id) || row.id <= 0 || !Number.isSafeInteger(row.revision) || row.revision < 0 || !selection(row.selection) || sizeOf(row) === null) return;
        const old = remotes.get(row.id);
        next.set(row.id, old && old.revision > row.revision ? old : { ...row, size: sizeOf(row) });
      }
      remotes.clear();
      for (const [id, row] of next) { remotes.set(id, row); ensure(row.selection); }
    } else if (msg.kind === "remove") {
      if (Array.isArray(msg.ids) && msg.ids.length <= 32) for (const id of msg.ids) remotes.delete(id);
    } else if (Number.isSafeInteger(msg.id) && msg.id > 0 && Number.isSafeInteger(msg.revision) && msg.revision >= 0 && selection(msg.selection) && sizeOf(msg) !== null) {
      if (msg.id === account) {
        if (msg.equipment) adopt(msg.equipment);
        else if (msg.revision > state.record.revision) adopt({ selection: msg.selection, size: sizeOf(msg), revision: msg.revision, declined: null, update: null });
      } else {
        const old = remotes.get(msg.id);
        if ((!old || msg.revision > old.revision) && (remotes.has(msg.id) || remotes.size < 32)) { remotes.set(msg.id, { ...msg, size: sizeOf(msg) }); ensure(msg.selection); }
      }
    }
    emit();
  };
  const apply = (cave, value) => {
    if (!cave || !BL.characterEquipment) return;
    const old = applied.get(cave);
    if (old && old.value === value && old.geometryEpoch === geometryEpoch) return;
    applied.set(cave, { value, geometryEpoch });
    const s = value ? value.selection : null;
    if (s && s.item !== "none" && !BL.equipmentHats.loaded(s.item, s.version)) { ensure(s); return; }
    BL.characterEquipment.apply(cave, s, value ? value.size : 100);
  };
  const applyLocal = (cave) => apply(cave, account && state.supported ? state.record : EMPTY);
  const applyRemote = (cave, id) => apply(cave, remotes.get(id) || EMPTY);
  const clear = (cave) => { applied.delete(cave); BL.characterEquipment?.apply(cave, null); };
  const notice = () => {
    const box = document.getElementById("equipment-update");
    if (!box) return;
    const update = state.record.update;
    box.hidden = !account || !state.supported || !update;
    if (!update) return;
    const item = BL.equipmentHats.items.find((entry) => entry.id === update.item);
    document.getElementById("equipment-update-text").textContent = `${item ? item.label : "Your hat"} has been updated by its creator. Keep this version or wear the update.`;
    document.getElementById("equipment-update-status").textContent = state.error || (state.busy ? "Saving…" : "");
    document.getElementById("equipment-accept").disabled = document.getElementById("equipment-decline").disabled = state.busy;
  };
  document.getElementById("equipment-accept")?.addEventListener("click", accept);
  document.getElementById("equipment-decline")?.addEventListener("click", decline);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && account && state.supported) { geometryEpoch++; refresh(); }
  });
  BL.net.subscribe((net) => {
    const id = net.me ? net.me.id : 0, supported = net.equipment === true;
    if (id !== account || supported !== state.supported) {
      account = id; epoch++; intent++; reading = null;
      state.supported = supported; state.record = EMPTY; state.busy = false; state.error = "";
      remotes.clear(); emit();
      if (account && supported) refresh();
    }
  });
  BL.equipment = { state, refresh, save, accept, decline, receive, applyLocal, applyRemote, clear,
    subscribe: (fn) => { subscribers.add(fn); return () => subscribers.delete(fn); } };
})();
