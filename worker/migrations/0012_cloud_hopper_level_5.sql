-- Cloud Hopper's fifth level, Storm's Eye, gets its own attributed board. Levels 1-4 keep their rows untouched.
-- A CHECK can't be altered in place, so the three tables that listed the four boards are rebuilt row for row with a
-- check any level's board passes (`cloud-hopper-l1` to `l9`), and their indexes and triggers are made again as they
-- stood. Dropping a table drops its own triggers; the players trigger that reads `cloud_hopper_runs` is dropped first
-- and made again after it (as 0009 left it), so the renames never meet a missing table.
INSERT INTO game_highscores (game_id, score_type, direction, unit) VALUES ('cloud-hopper-l5', 'ooga', 'asc', 'milliseconds');

DROP TRIGGER cloud_hopper_runs_rename;

CREATE TABLE cloud_hopper_runs_next (
  game TEXT NOT NULL REFERENCES game_highscores(game_id),
  run_id TEXT NOT NULL,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK(score > 0 AND score <= 3600000),
  achieved INTEGER NOT NULL,
  PRIMARY KEY(game, player_id, run_id),
  CHECK(game GLOB 'cloud-hopper-l[1-9]')
);
INSERT INTO cloud_hopper_runs_next(game, run_id, player_id, score, achieved)
  SELECT game, run_id, player_id, score, achieved FROM cloud_hopper_runs;
DROP TABLE cloud_hopper_runs;
ALTER TABLE cloud_hopper_runs_next RENAME TO cloud_hopper_runs;
CREATE INDEX cloud_hopper_runs_order ON cloud_hopper_runs(game, score, achieved, player_id, run_id);
CREATE TRIGGER cloud_hopper_run_inserted AFTER INSERT ON cloud_hopper_runs
BEGIN
  DELETE FROM cloud_hopper_runs WHERE game = NEW.game AND (player_id, run_id) IN
    (SELECT player_id, run_id FROM cloud_hopper_runs WHERE game = NEW.game
      ORDER BY score, achieved, player_id, run_id LIMIT -1 OFFSET 1024);
  UPDATE game_highscores SET revision = revision + 1, updated_at = MAX(updated_at, NEW.achieved)
    WHERE game_id = NEW.game;
END;
CREATE TRIGGER cloud_hopper_run_deleted AFTER DELETE ON cloud_hopper_runs
BEGIN
  UPDATE game_highscores SET revision = revision + 1 WHERE game_id = OLD.game;
END;
CREATE TRIGGER cloud_hopper_runs_rename AFTER UPDATE OF login ON players
WHEN lower(OLD.login) <> lower(NEW.login)
BEGIN
  UPDATE game_highscores SET revision = revision + 1
    WHERE game_id IN (SELECT game FROM cloud_hopper_runs WHERE player_id = NEW.id);
END;

-- The winners point at objects, so they wait in a plain copy while the objects' table is rebuilt, then return.
CREATE TABLE cloud_hopper_replay_objects_next (
  hash TEXT PRIMARY KEY CHECK(length(hash) = 64),
  game TEXT NOT NULL CHECK(game GLOB 'cloud-hopper-l[1-9]'),
  player_id INTEGER NOT NULL,
  score INTEGER NOT NULL,
  bytes INTEGER NOT NULL,
  course_version INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  retired_at INTEGER,
  state TEXT NOT NULL CHECK(state IN ('staged','ready','deleting'))
);
INSERT INTO cloud_hopper_replay_objects_next(hash, game, player_id, score, bytes, course_version, expires_at, retired_at, state)
  SELECT hash, game, player_id, score, bytes, course_version, expires_at, retired_at, state FROM cloud_hopper_replay_objects;
CREATE TABLE cloud_hopper_replay_winners_kept AS SELECT game, player_id, score, achieved, hash FROM cloud_hopper_replay_winners;
DROP TABLE cloud_hopper_replay_winners;
DROP TABLE cloud_hopper_replay_objects;
ALTER TABLE cloud_hopper_replay_objects_next RENAME TO cloud_hopper_replay_objects;
CREATE TABLE cloud_hopper_replay_winners (
  game TEXT PRIMARY KEY CHECK(game GLOB 'cloud-hopper-l[1-9]'),
  player_id INTEGER NOT NULL, score INTEGER NOT NULL, achieved INTEGER NOT NULL,
  hash TEXT NOT NULL REFERENCES cloud_hopper_replay_objects(hash)
);
INSERT INTO cloud_hopper_replay_winners(game, player_id, score, achieved, hash)
  SELECT game, player_id, score, achieved, hash FROM cloud_hopper_replay_winners_kept;
DROP TABLE cloud_hopper_replay_winners_kept;
CREATE TRIGGER cloud_hopper_replay_inserted AFTER INSERT ON cloud_hopper_replay_winners
BEGIN
  UPDATE game_highscores SET revision = revision + 1 WHERE game_id = NEW.game;
END;
CREATE TRIGGER cloud_hopper_replay_replaced AFTER UPDATE OF hash ON cloud_hopper_replay_winners
WHEN OLD.hash <> NEW.hash
BEGIN
  UPDATE game_highscores SET revision = revision + 1 WHERE game_id = NEW.game;
END;
