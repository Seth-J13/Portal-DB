# Portal DB

Sequelize models for the Portal facility ERD, loaded into MySQL and exposed through an Express API.

The database is a slice of the Enrichment Center, not the whole wiki. Every table has at least three rows.

## Setup

MySQL must be running. Copy the example environment file and set the account Workbench uses:

```powershell
copy .env.example .env
npm install
npm run setup
npm start
```

`npm run setup` drops and recreates `portal_db`, adds the constraints, loads the seed, and checks the join, the view, and the stored procedure.

On Windows, MySQL stores table names in lowercase. Workbench still opens them as `portal_guns`, `test_chambers`, and so on. The SQL in this project uses the ERD names.

## Schema notes

- `Portals` is one gun to many portals. The primary key is `(portal_gun_id, Color)`.
- `Hazards` is `(chamber_id, type)`, so one chamber can hold several hazards.
- `Prize_Cakes` and `Interactable_Test_Chambers` are the many-to-many tables from the diagram.
- `Humans.character_id` and `Robots.character_id` are unique, because those are one-to-one subtypes.
- `Surface.gel_type` is the foreign key to `Gel.type` (the Gel relationship on the ERD).
- `has_potatos` keeps the ERD spelling.
- `sex`, `is_a_lie`, `portalable`, and `has_potatos` are the bit columns. The API reads and writes them as booleans.

## Constraints

- `CHECK chk_portal_color`: `Portals.Color` is `Blue` or `Orange`.
- `CHECK chk_shaft_era`: `Shafts.era` is `Old` or `New`.
- `UNIQUE uq_characters_portal_gun`: a portal gun has one wielder.
- `UNIQUE uq_humans_character` and `UNIQUE uq_robots_character`.
- `INDEX idx_characters_name` on `Characters.name`.

## View and procedure

`vw_character_roster` joins characters, humans, robots, and portal guns.

`sp_chambers_in_shaft(shaft_id)` returns each chamber in a shaft with hazard, interactable, and surface counts.

## API

Base URL: `http://localhost:3000`

| Method | Path | Purpose |
| --- | --- | --- |
| GET, POST | `/api/characters` | List or create |
| GET, PUT, DELETE | `/api/characters/:id` | Read, update, or delete |
| GET | `/api/queries/portal-placements` | Characters, guns, portals, surfaces, chambers, and shafts |
| GET | `/api/views/character-roster` | Read `vw_character_roster` |
| GET | `/api/views/character-roster?kind=human` | Filter the view |
| GET | `/api/procedures/chambers-in-shaft/3` | Call `sp_chambers_in_shaft` |

The same create, read, update, and delete routes exist for `portal-guns`, `humans`, `robots`, `cakes`, `shafts`, `test-chambers`, `gels`, `interactables`, and `surfaces`.

Composite keys:

- `/api/portals/:portalGunId/:color`
- `/api/hazards/:chamberId/:type`
- `/api/prize-cakes/:cakeId/:humanId`
- `/api/interactable-test-chambers/:chamberId/:interactableType`

`GET /api` lists the routes. A portal color outside Blue and Orange is rejected by the check constraint:

```powershell
curl.exe -X POST http://localhost:3000/api/portals -H "Content-Type: application/json" -d '{"portal_gun_id":1,"Color":"Green","surface_id":1}'
```
