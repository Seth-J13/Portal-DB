import { sequelize } from './db.js';
import { Shaft, TestChamber } from './models.js';

const PORTAL_SHAFT = 'Portal';

const PORTAL_2 = {
  'Portal 2 Chapter 1': [
    'Portal 2 Chapter 1 Introduction',
    'Portal 2 Chapter 1 Test Chamber 1',
    'Portal 2 Chapter 1 Test Chamber 2',
    'Portal 2 Chapter 1 Test Chambers 3 & 4',
    'Portal 2 Chapter 1 Test Chamber 5',
    'Portal 2 Chapter 1 Test Chamber 6',
    'Portal 2 Chapter 1 Test Chambers 7 & 8',
  ],
  'Portal 2 Chapter 2': [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `Portal 2 Chapter 2 Test Chamber ${n}`),
  'Portal 2 Chapter 3': [9, 10, 11, 12, 13, 14, 15, 16, 17].map((n) => `Portal 2 Chapter 3 Test Chamber ${n}`),
  'Portal 2 Chapter 4': [
    'Portal 2 Chapter 4 Test Chamber 18',
    'Portal 2 Chapter 4 Test Chamber 19',
    'Portal 2 Chapter 4 Test Chamber 20',
    'Portal 2 Chapter 4 Test Chamber 21 (Escape)',
  ],
  'Portal 2 Chapter 8': [1, 2, 3, 4, 5, 6, 11, 12, 15, 16].map((n) => `Portal 2 Chapter 8 Test Chamber ${n}`),
  'Portal 2-The Part Where He Kills You': ['The Part Where He Kills You'],
};

function portalChambers() {
  const names = [];
  for (let n = 0; n <= 19; n += 1) {
    names.push(`Portal Test Chamber ${String(n).padStart(2, '0')}`);
  }
  for (let n = 13; n <= 18; n += 1) {
    const number = String(n).padStart(2, '0');
    names.push(`Portal Test Chamber ${number} (Advanced)`);
    names.push(`Portal Test Chamber ${number} (Bonus)`);
  }
  return names;
}

async function columnExists(table, column) {
  const [rows] = await sequelize.query(
    `SELECT COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND LOWER(TABLE_NAME) = LOWER(:tableName)
       AND LOWER(COLUMN_NAME) = LOWER(:columnName)`,
    { replacements: { tableName: table, columnName: column } }
  );
  return rows.length > 0;
}

async function shaftId(name) {
  const existing = await Shaft.findOne({ where: { name } });
  if (existing) return existing.shaft_id;
  const created = await Shaft.create({ era: 'New', name });
  return created.shaft_id;
}

export async function ensureGameChambers() {
  if (!(await columnExists('Shafts', 'name'))) {
    await sequelize.query('ALTER TABLE Shafts ADD COLUMN name VARCHAR(40) NULL');
  }
  if (!(await columnExists('Test_Chambers', 'name'))) {
    await sequelize.query('ALTER TABLE Test_Chambers ADD COLUMN name VARCHAR(80) NULL');
  }

  await sequelize.query(
    `UPDATE Shafts
     SET name = CONCAT('Seed track ', shaft_id)
     WHERE name IS NULL AND shaft_id BETWEEN 1 AND 4`
  );
  await sequelize.query(
    `UPDATE Test_Chambers
     SET name = CONCAT('Sample chamber ', chamber_id)
     WHERE name IS NULL AND chamber_id BETWEEN 1 AND 6`
  );
  await sequelize.query(
    `UPDATE Shafts
     SET name = 'Portal 2-The Part Where He Kills You'
     WHERE name = 'Portal 2 Chapter 9'`
  );

  const groups = [
    [PORTAL_SHAFT, portalChambers()],
    ...Object.entries(PORTAL_2),
  ];

  for (const [shaftName, chambers] of groups) {
    const shaft_id = await shaftId(shaftName);
    for (const name of chambers) {
      const existing = await TestChamber.findOne({ where: { name } });
      if (existing) continue;
      await TestChamber.create({ name, shaft_id });
    }
  }
}
