import { sequelize } from './db.js';
import { TABLE_MODELS } from './models.js';
import { chambersInShaft, getCharacterRoster, getPortalPlacements } from './queries.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function expectFailure(label, fn) {
  try {
    await fn();
  } catch (err) {
    const errno = err.parent?.errno ?? err.errno ?? err.original?.errno;
    return errno;
  }
  throw new Error(`${label} was accepted`);
}

export async function verifyDatabase() {
  const counts = {};
  for (const model of TABLE_MODELS) {
    counts[model.tableName] = await model.count();
    assert(counts[model.tableName] >= 3, `${model.tableName} has fewer than 3 rows`);
  }

  const [indexes] = await sequelize.query(
    `SELECT INDEX_NAME
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND LOWER(TABLE_NAME) = 'characters'
       AND INDEX_NAME = 'idx_characters_name'`
  );
  assert(indexes.length > 0, 'idx_characters_name is missing');

  const [checks] = await sequelize.query(
    `SELECT CONSTRAINT_NAME
     FROM information_schema.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = DATABASE()
       AND CONSTRAINT_TYPE = 'CHECK'
       AND CONSTRAINT_NAME IN ('chk_portal_color', 'chk_shaft_era')`
  );
  assert(checks.length === 2, 'CHECK constraints are missing');

  const [uniques] = await sequelize.query(
    `SELECT INDEX_NAME
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND NON_UNIQUE = 0
       AND INDEX_NAME = 'uq_characters_portal_gun'`
  );
  assert(uniques.length > 0, 'uq_characters_portal_gun is missing');

  const colorErrno = await expectFailure('Green portal', () => sequelize.query(
    "INSERT INTO Portals (portal_gun_id, Color, surface_id) VALUES (1, 'Green', 1)"
  ));
  assert(colorErrno === 3819, `expected CHECK failure, got errno ${colorErrno}`);

  const uniqueErrno = await expectFailure('second wielder', () => sequelize.query(
    "INSERT INTO Characters (name, portal_gun_id) VALUES ('Duplicate Wielder', 2)"
  ));
  assert(uniqueErrno === 1062, `expected UNIQUE failure, got errno ${uniqueErrno}`);

  const placements = await getPortalPlacements();
  assert(placements.length >= 3, 'portal placement join returned fewer than 3 characters');
  const chell = placements.find((row) => row.name === 'Chell');
  assert(chell?.portalGun?.portals?.length === 2, 'Chell should have two portals');

  const roster = await getCharacterRoster();
  assert(roster.length >= 3, 'character roster view is empty');
  const humans = await getCharacterRoster('human');
  assert(humans.length >= 3 && humans.every((row) => row.kind === 'human'), 'roster kind filter failed');

  const chambers = await chambersInShaft(3);
  assert(chambers.length === 2, 'stored procedure should return the two chambers in shaft 3');
  const chamber4 = chambers.find((row) => Number(row.chamber_id) === 4);
  assert(Number(chamber4?.hazard_count) === 2, 'shaft procedure hazard count mismatch');
  assert(Number(chamber4?.interactable_count) === 3, 'shaft procedure interactable count mismatch');
  assert(Number(chamber4?.surface_count) === 2, 'shaft procedure surface count mismatch');

  return { counts, placements: placements.length, roster: roster.length, chambers };
}
