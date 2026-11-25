import { sequelize } from './db.js';

const CHECKS = [
  {
    table: 'Portals',
    name: 'chk_portal_color',
    sql: "ALTER TABLE Portals ADD CONSTRAINT chk_portal_color CHECK (Color IN ('Blue', 'Orange'))",
  },
  {
    table: 'Shafts',
    name: 'chk_shaft_era',
    sql: "ALTER TABLE Shafts ADD CONSTRAINT chk_shaft_era CHECK (era IN ('Old', 'New'))",
  },
  {
    table: 'Humans',
    name: 'chk_human_sex',
    sql: "ALTER TABLE Humans ADD CONSTRAINT chk_human_sex CHECK (sex IN ('M', 'F'))",
  },
];

export const HAZARD_DESCRIPTIONS = {
  'Energy Pellet': 'A bouncing ball of energy. Touching it kills the test subject.',
  Turret: 'A sentry gun. It shoots bullets at anyone who steps into its line of sight.',
  Crusher: 'A moving plate that presses the test subject against the chamber until they are crushed.',
  Acid: 'A pool of toxic liquid. Falling in dissolves the test subject.',
  'Laser Field': 'A thermal discouragement beam. Contact burns the test subject.',
};

async function constraintExists(table, name) {
  const [rows] = await sequelize.query(
    `SELECT CONSTRAINT_NAME
     FROM information_schema.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = DATABASE()
       AND LOWER(TABLE_NAME) = LOWER(:tableName)
       AND CONSTRAINT_NAME = :constraintName`,
    { replacements: { tableName: table, constraintName: name } }
  );
  return rows.length > 0;
}

export async function ensureHumanSex() {
  const [columns] = await sequelize.query(
    `SELECT DATA_TYPE
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND LOWER(TABLE_NAME) = 'humans'
       AND LOWER(COLUMN_NAME) = 'sex'`
  );
  const dataType = String(columns[0]?.DATA_TYPE || '').toLowerCase();
  if (dataType === 'char' || dataType === 'varchar') return;

  await sequelize.query('DROP VIEW IF EXISTS vw_character_roster');
  await sequelize.query('ALTER TABLE Humans ADD COLUMN sex_code CHAR(1) NULL');
  await sequelize.query("UPDATE Humans SET sex_code = CASE WHEN sex = 1 THEN 'M' ELSE 'F' END");
  await sequelize.query('ALTER TABLE Humans DROP COLUMN sex');
  await sequelize.query('ALTER TABLE Humans CHANGE sex_code sex CHAR(1) NOT NULL');
}

export async function ensureHazardDescriptions() {
  const [columns] = await sequelize.query(
    `SELECT COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND LOWER(TABLE_NAME) = 'hazards'
       AND LOWER(COLUMN_NAME) = 'description'`
  );
  if (columns.length === 0) {
    await sequelize.query('ALTER TABLE Hazards ADD COLUMN description VARCHAR(255) NULL');
  }

  for (const [type, description] of Object.entries(HAZARD_DESCRIPTIONS)) {
    await sequelize.query(
      `UPDATE Hazards
       SET description = :description
       WHERE type = :type
         AND (description IS NULL OR description = '')`,
      { replacements: { type, description } }
    );
  }
}

export async function ensureChecks() {
  for (const check of CHECKS) {
    const exists = await constraintExists(check.table, check.name);
    if (!exists) {
      await sequelize.query(check.sql);
    }
  }
}

export async function ensureIndex() {
  const [rows] = await sequelize.query(
    `SELECT INDEX_NAME
     FROM information_schema.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND LOWER(TABLE_NAME) = 'characters'
       AND INDEX_NAME = 'idx_characters_name'`
  );

  if (rows.length === 0) {
    await sequelize.query('CREATE INDEX idx_characters_name ON Characters (name)');
  }
}

const VIEW_SQL = `
CREATE VIEW vw_character_roster AS
SELECT
  c.character_id,
  c.name,
  c.portal_gun_id,
  pg.has_potatos,
  CASE
    WHEN h.human_id IS NOT NULL THEN 'human'
    WHEN r.robot_id IS NOT NULL THEN 'robot'
    ELSE 'unspecified'
  END AS kind,
  h.human_id,
  h.sex,
  h.assignment AS human_assignment,
  r.robot_id,
  r.type AS robot_type,
  r.assignment AS robot_assignment,
  r.description AS robot_description
FROM Characters c
LEFT JOIN Humans h ON h.character_id = c.character_id
LEFT JOIN Robots r ON r.character_id = c.character_id
LEFT JOIN Portal_Guns pg ON pg.portal_gun_id = c.portal_gun_id
`;

export async function ensureView() {
  await sequelize.query('DROP VIEW IF EXISTS vw_character_roster');
  await sequelize.query(VIEW_SQL);
}

const PROCEDURE_SQL = `
CREATE PROCEDURE sp_chambers_in_shaft(IN p_shaft_id INT)
BEGIN
  SELECT
    tc.chamber_id,
    tc.name,
    tc.shaft_id,
    sh.era,
    COUNT(DISTINCT hz.type) AS hazard_count,
    COUNT(DISTINCT itc.Interactable_type) AS interactable_count,
    COUNT(DISTINCT sf.surface_id) AS surface_count
  FROM Test_Chambers tc
  INNER JOIN Shafts sh ON sh.shaft_id = tc.shaft_id
  LEFT JOIN Hazards hz ON hz.chamber_id = tc.chamber_id
  LEFT JOIN Interactable_Test_Chambers itc ON itc.chamber_id = tc.chamber_id
  LEFT JOIN Surface sf ON sf.chamber_id = tc.chamber_id
  WHERE tc.shaft_id = p_shaft_id
  GROUP BY tc.chamber_id, tc.name, tc.shaft_id, sh.era
  ORDER BY tc.chamber_id;
END
`;

export async function ensureProcedure() {
  await sequelize.query('DROP PROCEDURE IF EXISTS sp_chambers_in_shaft');
  await sequelize.query(PROCEDURE_SQL);
}
