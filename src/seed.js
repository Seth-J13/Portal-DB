import { HAZARD_DESCRIPTIONS } from './schema.js';
import {
  Cake,
  Character,
  Gel,
  Hazard,
  Human,
  Interactable,
  InteractableTestChamber,
  Portal,
  PortalGun,
  PrizeCake,
  Robot,
  Shaft,
  Surface,
  TestChamber,
} from './models.js';

/**
 * A small slice of the Enrichment Center, not the whole wiki.
 * Every table gets at least three rows, and foreign keys point at real parents.
 */
export async function seed(transaction) {
  await Gel.bulkCreate([
    { type: 'Repulsion' },
    { type: 'Propulsion' },
    { type: 'Conversion' },
  ], { transaction });

  await Shaft.bulkCreate([
    { shaft_id: 1, era: 'Old', name: 'Seed track 1' },
    { shaft_id: 2, era: 'Old', name: 'Seed track 2' },
    { shaft_id: 3, era: 'New', name: 'Seed track 3' },
    { shaft_id: 4, era: 'New', name: 'Seed track 4' },
  ], { transaction });

  await PortalGun.bulkCreate([
    { portal_gun_id: 1, has_potatos: false },
    { portal_gun_id: 2, has_potatos: true },
    { portal_gun_id: 3, has_potatos: false },
    { portal_gun_id: 4, has_potatos: false },
  ], { transaction });

  await Interactable.bulkCreate([
    { type: 'Weighted Cube', description: 'A storage cube heavy enough to hold a button.' },
    { type: 'Button', description: 'Floor button. Stays down while something heavy is on it.' },
    { type: 'Pedestal Button', description: null },
    { type: 'Door', description: 'Opens when the chamber logic is satisfied.' },
    { type: 'Light Bridge', description: 'A hard-light surface that can be walked on or portaled through.' },
    { type: 'Faith Plate', description: 'Launches the subject across the chamber.' },
    { type: 'Excursion Funnel', description: 'A beam of aerogel that carries objects and subjects.' },
  ], { transaction });

  await Cake.bulkCreate([
    { cake_id: 1, flavor: 'Chocolate', is_a_lie: true },
    { cake_id: 2, flavor: 'Vanilla', is_a_lie: true },
    { cake_id: 3, flavor: 'Lemon', is_a_lie: true },
    { cake_id: 4, flavor: 'Black Forest', is_a_lie: false },
  ], { transaction });

  await TestChamber.bulkCreate([
    { chamber_id: 1, shaft_id: 1, name: 'Sample chamber 1' },
    { chamber_id: 2, shaft_id: 1, name: 'Sample chamber 2' },
    { chamber_id: 3, shaft_id: 2, name: 'Sample chamber 3' },
    { chamber_id: 4, shaft_id: 3, name: 'Sample chamber 4' },
    { chamber_id: 5, shaft_id: 3, name: 'Sample chamber 5' },
    { chamber_id: 6, shaft_id: 4, name: 'Sample chamber 6' },
  ], { transaction });

  await Character.bulkCreate([
    { character_id: 1, name: 'Chell', portal_gun_id: 2 },
    { character_id: 2, name: 'Doug Rattmann', portal_gun_id: null },
    { character_id: 3, name: 'Cave Johnson', portal_gun_id: null },
    { character_id: 4, name: 'Caroline', portal_gun_id: null },
    { character_id: 5, name: 'GLaDOS', portal_gun_id: null },
    { character_id: 6, name: 'Wheatley', portal_gun_id: null },
    { character_id: 7, name: 'Atlas', portal_gun_id: 3 },
    { character_id: 8, name: 'P-body', portal_gun_id: 4 },
    { character_id: 9, name: 'Defective Turret', portal_gun_id: null },
  ], { transaction });

  // sex is M or F: male or female.
  await Human.bulkCreate([
    { human_id: 1, character_id: 1, sex: 'F', assignment: 'Test Subject' },
    { human_id: 2, character_id: 2, sex: 'M', assignment: 'Scientist' },
    { human_id: 3, character_id: 3, sex: 'M', assignment: 'Founder' },
    { human_id: 4, character_id: 4, sex: 'F', assignment: 'Assistant' },
  ], { transaction });

  await Robot.bulkCreate([
    {
      robot_id: 1,
      character_id: 5,
      type: 'Genetic Lifeform and Disk Operating System',
      assignment: 'Central Core',
      description: 'Runs the Enrichment Center and writes the tests.',
    },
    {
      robot_id: 2,
      character_id: 6,
      type: 'Personality Core',
      assignment: 'Intelligence Dampening',
      description: 'A core designed to have terrible ideas.',
    },
    {
      robot_id: 3,
      character_id: 7,
      type: 'Co-op Bot',
      assignment: 'Co-op Testing',
      description: 'Atlas, the blue cooperative testing android.',
    },
    {
      robot_id: 4,
      character_id: 8,
      type: 'Co-op Bot',
      assignment: 'Co-op Testing',
      description: 'P-body, the orange cooperative testing android.',
    },
    {
      robot_id: 5,
      character_id: 9,
      type: 'Sentry Turret',
      assignment: 'Chamber Defense',
      description: null,
    },
  ], { transaction });

  await Surface.bulkCreate([
    { surface_id: 1, portalable: true, chamber_id: 4, gel_type: null },
    { surface_id: 2, portalable: false, chamber_id: 4, gel_type: null },
    { surface_id: 3, portalable: true, chamber_id: 5, gel_type: 'Repulsion' },
    { surface_id: 4, portalable: true, chamber_id: 5, gel_type: 'Propulsion' },
    { surface_id: 5, portalable: true, chamber_id: 1, gel_type: null },
    { surface_id: 6, portalable: true, chamber_id: 2, gel_type: 'Conversion' },
    { surface_id: 7, portalable: true, chamber_id: 6, gel_type: null },
    { surface_id: 8, portalable: true, chamber_id: 3, gel_type: null },
    { surface_id: 9, portalable: false, chamber_id: 6, gel_type: null },
  ], { transaction });

  await Portal.bulkCreate([
    { portal_gun_id: 1, Color: 'Blue', surface_id: 1 },
    { portal_gun_id: 1, Color: 'Orange', surface_id: 5 },
    { portal_gun_id: 2, Color: 'Blue', surface_id: 3 },
    { portal_gun_id: 2, Color: 'Orange', surface_id: 4 },
    { portal_gun_id: 3, Color: 'Blue', surface_id: 5 },
    { portal_gun_id: 3, Color: 'Orange', surface_id: 7 },
    { portal_gun_id: 4, Color: 'Blue', surface_id: 8 },
    { portal_gun_id: 4, Color: 'Orange', surface_id: 1 },
  ], { transaction });

  await Hazard.bulkCreate([
    { chamber_id: 1, type: 'Energy Pellet', description: HAZARD_DESCRIPTIONS['Energy Pellet'] },
    { chamber_id: 1, type: 'Turret', description: HAZARD_DESCRIPTIONS.Turret },
    { chamber_id: 2, type: 'Turret', description: HAZARD_DESCRIPTIONS.Turret },
    { chamber_id: 3, type: 'Crusher', description: HAZARD_DESCRIPTIONS.Crusher },
    { chamber_id: 4, type: 'Turret', description: HAZARD_DESCRIPTIONS.Turret },
    { chamber_id: 4, type: 'Acid', description: HAZARD_DESCRIPTIONS.Acid },
    { chamber_id: 5, type: 'Laser Field', description: HAZARD_DESCRIPTIONS['Laser Field'] },
    { chamber_id: 5, type: 'Crusher', description: HAZARD_DESCRIPTIONS.Crusher },
    { chamber_id: 6, type: 'Acid', description: HAZARD_DESCRIPTIONS.Acid },
  ], { transaction });

  await InteractableTestChamber.bulkCreate([
    { chamber_id: 1, Interactable_type: 'Door' },
    { chamber_id: 1, Interactable_type: 'Button' },
    { chamber_id: 2, Interactable_type: 'Weighted Cube' },
    { chamber_id: 2, Interactable_type: 'Door' },
    { chamber_id: 3, Interactable_type: 'Button' },
    { chamber_id: 3, Interactable_type: 'Pedestal Button' },
    { chamber_id: 4, Interactable_type: 'Button' },
    { chamber_id: 4, Interactable_type: 'Door' },
    { chamber_id: 4, Interactable_type: 'Weighted Cube' },
    { chamber_id: 5, Interactable_type: 'Faith Plate' },
    { chamber_id: 5, Interactable_type: 'Light Bridge' },
    { chamber_id: 5, Interactable_type: 'Button' },
    { chamber_id: 6, Interactable_type: 'Excursion Funnel' },
    { chamber_id: 6, Interactable_type: 'Pedestal Button' },
  ], { transaction });

  await PrizeCake.bulkCreate([
    { cake_id: 1, human_id: 1 },
    { cake_id: 2, human_id: 1 },
    { cake_id: 1, human_id: 2 },
    { cake_id: 3, human_id: 3 },
    { cake_id: 4, human_id: 4 },
  ], { transaction });
}
