import { sequelize, ensureDatabase } from './db.js';
import { Character, TABLE_MODELS, initCharacterRoster } from './models.js';
import { ensureChecks, ensureIndex, ensureProcedure, ensureView } from './schema.js';
import { seed } from './seed.js';

async function syncTables(force) {
  if (force) {
    const dropOrder = [...TABLE_MODELS].reverse();
    for (const model of dropOrder) {
      await model.drop();
    }
  }

  for (const model of TABLE_MODELS) {
    await model.sync();
  }
}

export async function initDatabase({ force = false } = {}) {
  await ensureDatabase();
  await sequelize.authenticate();

  if (force) {
    await sequelize.query('DROP VIEW IF EXISTS vw_character_roster');
    await sequelize.query('DROP PROCEDURE IF EXISTS sp_chambers_in_shaft');
  }

  await syncTables(force);
  await ensureChecks();
  await ensureIndex();
  await ensureView();
  await ensureProcedure();
  initCharacterRoster();

  const populated = await Character.count();
  if (populated === 0) {
    await sequelize.transaction((transaction) => seed(transaction));
  }
}

export async function closeDatabase() {
  await sequelize.close();
}
