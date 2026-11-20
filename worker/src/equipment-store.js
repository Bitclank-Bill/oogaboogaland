// D1 remains authoritative across room restarts. Every write checks the authenticated session
// in the same statement as its revision CAS, so a removed account/session cannot be resurrected.
import { equipmentRecord, nextEquipment } from "./equipment-model.js";

const rowOf = row => row && row.revision !== null ? row : null;
export const readEquipment = async (db, id, tokenHash = null) => {
  const row = await db.prepare(`SELECT e.item, e.version, e.revision, e.declined
    FROM players p LEFT JOIN player_equipment e ON e.player_id = p.id
    WHERE p.id = ?1 AND p.banned_at IS NULL
      AND (?2 IS NULL OR EXISTS (SELECT 1 FROM sessions s WHERE s.player_id = p.id AND s.token_hash = ?2 AND s.expires_at > ?3))`)
    .bind(id, tokenHash, Math.floor(Date.now() / 1000)).first();
  return row ? equipmentRecord(rowOf(row)) : null;
};

export const writeEquipment = async (db, id, tokenHash, command) => {
  const current = await readEquipment(db, id, tokenHash);
  if (!current) return { status: 401, error: "unauthenticated" };
  let next;
  try { next = nextEquipment(current, command); }
  catch (error) {
    if (error.code === "invalid_update") return { status: 409, error: "conflict", equipment: current };
    throw error;
  }
  if (!next) return { status: 409, error: "conflict", equipment: current };
  const row = await db.prepare(`INSERT INTO player_equipment (player_id, item, version, revision, declined, updated_at)
    SELECT ?1, ?2, ?3, ?4 + 1, ?5, ?6 FROM players p
    WHERE p.id = ?1 AND p.banned_at IS NULL
      AND EXISTS (SELECT 1 FROM sessions s WHERE s.player_id = p.id AND s.token_hash = ?7 AND s.expires_at > ?6)
      AND (?4 = 0 OR EXISTS (SELECT 1 FROM player_equipment e WHERE e.player_id = p.id AND e.revision = ?4))
    ON CONFLICT(player_id) DO UPDATE SET item = excluded.item, version = excluded.version,
      revision = player_equipment.revision + 1, declined = excluded.declined, updated_at = excluded.updated_at
    WHERE player_equipment.revision = ?4
    RETURNING item, version, revision, declined`)
    .bind(id, next.selection?.item ?? null, next.selection?.version ?? null, command.revision, next.declined,
      Math.floor(Date.now() / 1000), tokenHash).first();
  if (row) return { status: 200, equipment: equipmentRecord(row) };
  const latest = await readEquipment(db, id, tokenHash);
  return latest ? { status: 409, error: "conflict", equipment: latest } : { status: 401, error: "unauthenticated" };
};
