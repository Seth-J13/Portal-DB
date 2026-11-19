# Portal DB

Sequelize models for the Portal facility ERD, loaded into MySQL, with a GUI for browsing and editing the rows.

The hand-written seed is a slice of the Enrichment Center. `npm run import` then loads the Portal Wiki into `Wiki_Articles` (2,000+ rows) and adds matching characters, items, and gels to the ERD tables.

## Setup

MySQL must be running. Copy the example environment file and set the account Workbench uses:

```powershell
copy .env.example .env
npm install
npm run setup
npm run import
npm start
```

Open the GUI at `http://localhost:3000`.

`npm run setup` drops and recreates `portal_db`, adds the constraints, loads the seed, and checks the join, the view, and the stored procedure. It leaves `Wiki_Articles` empty so setup still works offline.

`npm run import` reads every non-redirect article from the [Portal Wiki API](https://theportalwiki.com/w/api.php) and upserts `page_id`, title, categories, language, the lead text, and the canonical URL.

On Windows, MySQL stores table names in lowercase. Workbench still opens them as `portal_guns`, `test_chambers`, and so on. The SQL in this project uses the ERD names.

## Schema notes

- `Portals` is one gun to many portals. The primary key is `(portal_gun_id, Color)`.
- `Hazards` is `(chamber_id, type)`, so one chamber can hold several hazards.
- `Prize_Cakes` and `Interactable_Test_Chambers` are the many-to-many tables from the diagram.
- `Humans.character_id` and `Robots.character_id` are unique, because those are one-to-one subtypes.
- `Surface.gel_type` is the foreign key to `Gel.type` (the Gel relationship on the ERD).
- `has_potatos` keeps the ERD spelling.
- `sex`, `is_a_lie`, `portalable`, and `has_potatos` are the bit columns. The API reads and writes them as booleans.
- `Wiki_Articles` is the import table. `page_id` is the Portal Wiki page id, not an auto-increment.

## Constraints

- `CHECK chk_portal_color`: `Portals.Color` is `Blue` or `Orange`.
- `CHECK chk_shaft_era`: `Shafts.era` is `Old` or `New`.
- `UNIQUE uq_characters_portal_gun`: a portal gun has one wielder.
- `UNIQUE uq_humans_character` and `UNIQUE uq_robots_character`.
- `INDEX idx_characters_name` on `Characters.name`.
- `INDEX idx_wiki_articles_title` on `Wiki_Articles.title`.
- `INDEX idx_wiki_articles_kind` on `Wiki_Articles.kind`.

## View and procedure

`vw_character_roster` joins characters, humans, robots, and portal guns.

`sp_chambers_in_shaft(shaft_id)` returns each chamber in a shaft with hazard, interactable, and surface counts.

## GUI

`http://localhost:3000` lists every table, including composite keys. Search, create, edit, and delete go through the same Sequelize routes as the API. Reports run the multi-table join, `vw_character_roster`, and `sp_chambers_in_shaft`.

## Natural language

Ask is a question box. The server sends the schema to an OpenAI-compatible model, runs the returned statement only if it is a single read-only `SELECT`, then asks the model to answer from those rows. The page shows the SQL and the result set next to the answer.

Set `LLM_API_KEY` in `.env`, or paste a key into Ask settings (stored in the browser and sent only to this server). Groq, OpenAI, OpenRouter, and a local Ollama server all use the same endpoint shape. See `.env.example`.

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

The same create, read, update, and delete routes exist for `portal-guns`, `humans`, `robots`, `cakes`, `shafts`, `test-chambers`, `gels`, `interactables`, `surfaces`, and `wiki-articles`.

List routes still return a JSON array. Add `limit`, `offset`, and `q` to page and search: `/api/wiki-articles?limit=40&offset=0&q=Chell` returns `{ data, total, limit, offset }`.

`POST /api/ask` with `{ "question": "Which humans hold a portal gun?" }` returns `{ answer, sql, rows, rowCount }`. An optional `apiKey`, `baseUrl`, and `model` override the `.env` values for that request.

Composite keys:

- `/api/portals/:portalGunId/:color`
- `/api/hazards/:chamberId/:type`
- `/api/prize-cakes/:cakeId/:humanId`
- `/api/interactable-test-chambers/:chamberId/:interactableType`

`GET /api` lists the routes. A portal color outside Blue and Orange is rejected by the check constraint:

```powershell
curl.exe -X POST http://localhost:3000/api/portals -H "Content-Type: application/json" -d '{"portal_gun_id":1,"Color":"Green","surface_id":1}'
```
