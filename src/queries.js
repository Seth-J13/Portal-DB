import { sequelize } from './db.js';
import {
  Character,
  Gel,
  Portal,
  PortalGun,
  Shaft,
  Surface,
  TestChamber,
  getCharacterRosterModel,
} from './models.js';

/**
 * Characters who are holding a portal gun, the portals that gun has open,
 * the surface each portal is on, and the chamber and shaft of that surface.
 * Gel is included when the surface has one.
 */
export function getPortalPlacements() {
  return Character.findAll({
    attributes: ['character_id', 'name'],
    include: [
      {
        model: PortalGun,
        as: 'portalGun',
        required: true,
        attributes: ['portal_gun_id', 'has_potatos'],
        include: [
          {
            model: Portal,
            as: 'portals',
            required: true,
            attributes: ['Color', 'surface_id'],
            include: [
              {
                model: Surface,
                as: 'surface',
                required: true,
                attributes: ['surface_id', 'portalable', 'gel_type', 'chamber_id'],
                include: [
                  {
                    model: TestChamber,
                    as: 'chamber',
                    required: true,
                    attributes: ['chamber_id', 'shaft_id'],
                    include: [
                      {
                        model: Shaft,
                        as: 'shaft',
                        required: true,
                        attributes: ['shaft_id', 'era'],
                      },
                    ],
                  },
                  {
                    model: Gel,
                    as: 'gel',
                    required: false,
                    attributes: ['type'],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
    order: [['character_id', 'ASC']],
    subQuery: false,
  });
}

export function getCharacterRoster(kind) {
  const where = {};
  if (kind) where.kind = kind;
  return getCharacterRosterModel().findAll({
    where,
    order: [['character_id', 'ASC']],
  });
}

export async function chambersInShaft(shaftId) {
  const result = await sequelize.query('CALL sp_chambers_in_shaft(:shaftId)', {
    replacements: { shaftId },
  });
  const rows = Array.isArray(result) ? result.flat(1) : [];
  return rows.filter((row) => row && row.chamber_id !== undefined && row.chamber_id !== null);
}
