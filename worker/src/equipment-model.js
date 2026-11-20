// Account choices pin an immutable hat version. A missing choice keeps the authored character;
// `none` explicitly removes its hat. Registry updates only offer a choice; they never accept it.
import { equipmentHats } from "./equipment-hats.js";

const HASH = /^[a-f0-9]{64}$/;
const plain = value => !!value && typeof value === "object" && !Array.isArray(value);
const exact = (value, keys) => plain(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
export const equipmentEnabled = env => env?.EQUIPMENT_ENABLED === "1";
export const equipmentRevision = value => Number.isSafeInteger(value) && value >= 0 && value < Number.MAX_SAFE_INTEGER;

export const equipmentSelection = (value, hats = equipmentHats) => {
  if (value === null) return null;
  if (!exact(value, ["item", "version"]) || typeof value.item !== "string" || value.item.length > 64
    || (value.item === "none" ? value.version !== null : !HASH.test(value.version))) throw new TypeError("Invalid hat selection");
  if (!hats.has(value.item, value.version)) throw new TypeError("Unknown hat version");
  return { item: value.item, version: value.version };
};

export const equipmentRecord = (row, hats = equipmentHats) => {
  if (!row) return { selection: null, revision: 0, declined: null, update: null };
  if (!equipmentRevision(row.revision) || row.revision === 0 || (row.declined !== null && !HASH.test(row.declined)))
    throw new TypeError("Invalid stored equipment");
  const selection = equipmentSelection(row.item === null ? null : { item: row.item, version: row.version }, hats);
  if ((!selection || selection.item === "none") && row.declined !== null) throw new TypeError("Invalid declined update");
  const current = selection && selection.item !== "none" ? hats.current(selection.item) : null;
  return { selection, revision: row.revision, declined: row.declined,
    update: current && current !== selection.version && current !== row.declined ? { item: selection.item, version: current } : null };
};

export const equipmentCommand = (value, hats = equipmentHats) => {
  if (!plain(value) || !equipmentRevision(value.revision)) throw new TypeError("Invalid equipment revision");
  if (exact(value, ["revision", "selection"])) return { revision: value.revision, selection: equipmentSelection(value.selection, hats) };
  if (exact(value, ["revision", "decline"]) && HASH.test(value.decline)) return { revision: value.revision, decline: value.decline };
  throw new TypeError("Invalid equipment change");
};

export const nextEquipment = (current, command) => {
  if (current.revision !== command.revision) return null;
  if (Object.hasOwn(command, "decline")) {
    if (!current.update || command.decline !== current.update.version) throw Object.assign(new TypeError("That update is no longer offered"), { code: "invalid_update" });
    return { selection: current.selection, declined: command.decline };
  }
  const unchanged = current.selection?.item === command.selection?.item && current.selection?.version === command.selection?.version;
  return { selection: command.selection, declined: unchanged ? current.declined : null };
};
