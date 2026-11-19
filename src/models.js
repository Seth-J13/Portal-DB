import { DataTypes } from 'sequelize';
import { sequelize } from './db.js';
import { httpError } from './errors.js';

/**
 * Tables follow the Portal ERD.
 *
 * Portals is a one-to-many child of Portal_Guns (a gun places an orange portal
 * and a blue portal), so the primary key is (portal_gun_id, Color).
 * Hazards, Prize_Cakes, and Interactable_Test_Chambers are composite keys for
 * the same reason: the relationship is many-to-many or one-to-many with a
 * natural discriminator already on the diagram.
 *
 * Humans and Robots are one-to-one subtypes of Characters, so character_id is UNIQUE.
 * A portal gun is held by at most one character, so Characters.portal_gun_id is UNIQUE.
 */

export const Gel = sequelize.define('Gel', {
  type: {
    type: DataTypes.STRING(255),
    primaryKey: true,
    allowNull: false,
  },
}, { tableName: 'Gel' });

export const Shaft = sequelize.define('Shaft', {
  shaft_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  era: {
    type: DataTypes.CHAR(4),
    allowNull: false,
    validate: {
      isIn: {
        args: [['Old', 'New']],
        msg: "era must be 'Old' or 'New'",
      },
    },
  },
}, { tableName: 'Shafts' });

export const PortalGun = sequelize.define('PortalGun', {
  portal_gun_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  // Spelling matches the ERD column has_potatos.
  has_potatos: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, { tableName: 'Portal_Guns' });

export const Interactable = sequelize.define('Interactable', {
  type: {
    type: DataTypes.STRING(255),
    primaryKey: true,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, { tableName: 'Interactable' });

export const Cake = sequelize.define('Cake', {
  cake_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  flavor: {
    type: DataTypes.STRING(30),
    allowNull: false,
    validate: { notEmpty: true },
  },
  is_a_lie: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
}, { tableName: 'Cake' });

export const TestChamber = sequelize.define('TestChamber', {
  chamber_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  shaft_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, { tableName: 'Test_Chambers' });

export const Character = sequelize.define('Character', {
  character_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: { notEmpty: true },
  },
  portal_gun_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    unique: 'uq_characters_portal_gun',
  },
}, {
  tableName: 'Characters',
  indexes: [
    { name: 'idx_characters_name', fields: ['name'] },
  ],
});

export const Human = sequelize.define('Human', {
  human_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  character_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: 'uq_humans_character',
  },
  sex: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  assignment: {
    type: DataTypes.STRING(15),
    allowNull: false,
    validate: { notEmpty: true },
  },
}, { tableName: 'Humans' });

export const Robot = sequelize.define('Robot', {
  robot_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  character_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: 'uq_robots_character',
  },
  type: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  assignment: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: { notEmpty: true },
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, { tableName: 'Robots' });

export const Surface = sequelize.define('Surface', {
  surface_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  portalable: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  chamber_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // Foreign key to Gel.type. The ERD labels this relationship Gel/type.
  gel_type: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, { tableName: 'Surface' });

export const Portal = sequelize.define('Portal', {
  portal_gun_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  Color: {
    type: DataTypes.STRING(10),
    primaryKey: true,
    allowNull: false,
    validate: {
      isIn: {
        args: [['Blue', 'Orange']],
        msg: "Color must be 'Blue' or 'Orange'",
      },
    },
  },
  surface_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, { tableName: 'Portals' });

export const Hazard = sequelize.define('Hazard', {
  chamber_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING(28),
    primaryKey: true,
    allowNull: false,
    validate: { notEmpty: true, len: [1, 28] },
  },
}, { tableName: 'Hazards' });

export const InteractableTestChamber = sequelize.define('InteractableTestChamber', {
  Interactable_type: {
    type: DataTypes.STRING(255),
    primaryKey: true,
    allowNull: false,
  },
  chamber_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
}, { tableName: 'Interactable_Test_Chambers' });

// Pages imported from the Portal Wiki API (theportalwiki.com). page_id is the wiki's id.
export const WikiArticle = sequelize.define('WikiArticle', {
  page_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  kind: {
    type: DataTypes.STRING(32),
    allowNull: false,
  },
  language: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  categories: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  extract: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  wiki_url: {
    type: DataTypes.STRING(512),
    allowNull: false,
  },
}, {
  tableName: 'Wiki_Articles',
  indexes: [
    { name: 'idx_wiki_articles_title', fields: ['title'] },
    { name: 'idx_wiki_articles_kind', fields: ['kind'] },
  ],
});

export const PrizeCake = sequelize.define('PrizeCake', {
  cake_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  human_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
}, { tableName: 'Prize_Cakes' });

function belongsTo(source, target, options) {
  source.belongsTo(target, options);
}

function hasMany(source, target, foreignKey, as) {
  source.hasMany(target, { foreignKey, as, constraints: false });
}

function hasOne(source, target, foreignKey, as) {
  source.hasOne(target, { foreignKey, as, constraints: false });
}

async function assertNotTheOtherSubtype(characterId, otherModel) {
  if (characterId == null) return;
  const other = await otherModel.findOne({ where: { character_id: characterId } });
  if (other) {
    throw httpError(409, 'A character cannot be both a human and a robot');
  }
}

belongsTo(TestChamber, Shaft, {
  foreignKey: 'shaft_id',
  as: 'shaft',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});
hasMany(Shaft, TestChamber, 'shaft_id', 'chambers');

belongsTo(Character, PortalGun, {
  foreignKey: 'portal_gun_id',
  as: 'portalGun',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});
hasOne(PortalGun, Character, 'portal_gun_id', 'wielder');

belongsTo(Human, Character, {
  foreignKey: 'character_id',
  as: 'character',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
hasOne(Character, Human, 'character_id', 'human');

belongsTo(Robot, Character, {
  foreignKey: 'character_id',
  as: 'character',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
hasOne(Character, Robot, 'character_id', 'robot');

belongsTo(Surface, TestChamber, {
  foreignKey: 'chamber_id',
  as: 'chamber',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
hasMany(TestChamber, Surface, 'chamber_id', 'surfaces');

belongsTo(Surface, Gel, {
  foreignKey: 'gel_type',
  targetKey: 'type',
  as: 'gel',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});
Gel.hasMany(Surface, {
  foreignKey: 'gel_type',
  sourceKey: 'type',
  as: 'surfaces',
  constraints: false,
});

belongsTo(Portal, PortalGun, {
  foreignKey: 'portal_gun_id',
  as: 'portalGun',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
hasMany(PortalGun, Portal, 'portal_gun_id', 'portals');

belongsTo(Portal, Surface, {
  foreignKey: 'surface_id',
  as: 'surface',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});
hasMany(Surface, Portal, 'surface_id', 'portals');

belongsTo(Hazard, TestChamber, {
  foreignKey: 'chamber_id',
  as: 'chamber',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
hasMany(TestChamber, Hazard, 'chamber_id', 'hazards');

belongsTo(InteractableTestChamber, Interactable, {
  foreignKey: 'Interactable_type',
  targetKey: 'type',
  as: 'interactable',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
Interactable.hasMany(InteractableTestChamber, {
  foreignKey: 'Interactable_type',
  sourceKey: 'type',
  as: 'placements',
  constraints: false,
});

belongsTo(InteractableTestChamber, TestChamber, {
  foreignKey: 'chamber_id',
  as: 'chamber',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
hasMany(TestChamber, InteractableTestChamber, 'chamber_id', 'interactableLinks');

belongsTo(PrizeCake, Cake, {
  foreignKey: 'cake_id',
  as: 'cake',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
hasMany(Cake, PrizeCake, 'cake_id', 'prizes');

belongsTo(PrizeCake, Human, {
  foreignKey: 'human_id',
  as: 'human',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
hasMany(Human, PrizeCake, 'human_id', 'prizes');

Human.addHook('beforeCreate', (human) => assertNotTheOtherSubtype(human.character_id, Robot));
Human.addHook('beforeUpdate', (human) => assertNotTheOtherSubtype(human.character_id, Robot));
Robot.addHook('beforeCreate', (robot) => assertNotTheOtherSubtype(robot.character_id, Human));
Robot.addHook('beforeUpdate', (robot) => assertNotTheOtherSubtype(robot.character_id, Human));

export const TABLE_MODELS = [
  Gel,
  Shaft,
  PortalGun,
  Interactable,
  Cake,
  TestChamber,
  Character,
  Human,
  Robot,
  Surface,
  Portal,
  Hazard,
  InteractableTestChamber,
  PrizeCake,
  WikiArticle,
];

let characterRoster;

export function initCharacterRoster() {
  if (characterRoster) return characterRoster;

  characterRoster = sequelize.define('CharacterRoster', {
    character_id: { type: DataTypes.INTEGER, primaryKey: true },
    name: DataTypes.STRING(50),
    portal_gun_id: DataTypes.INTEGER,
    has_potatos: DataTypes.BOOLEAN,
    kind: DataTypes.STRING(20),
    human_id: DataTypes.INTEGER,
    sex: DataTypes.BOOLEAN,
    human_assignment: DataTypes.STRING(15),
    robot_id: DataTypes.INTEGER,
    robot_type: DataTypes.STRING(100),
    robot_assignment: DataTypes.STRING(50),
    robot_description: DataTypes.STRING(255),
  }, {
    tableName: 'vw_character_roster',
    timestamps: false,
  });

  return characterRoster;
}

export function getCharacterRosterModel() {
  if (!characterRoster) {
    throw new Error('Character roster view is not initialized');
  }
  return characterRoster;
}
