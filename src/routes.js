import { Router } from 'express';
import { askAboutData, llmStatus } from './ask.js';
import { httpError } from './errors.js';
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
  TABLE_MODELS,
  TestChamber,
  WikiArticle,
} from './models.js';
import { createRecord, deleteRecord, getRecord, listRecords, listRecordsPage, updateRecord } from './crud.js';
import { chambersInShaft, getCharacterRoster, getPortalPlacements } from './queries.js';

export const api = Router();

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function requireBody(req) {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    throw httpError(400, 'JSON object body is required');
  }
  return req.body;
}

function integerId(value, label) {
  if (!/^\d+$/.test(String(value))) {
    throw httpError(400, `${label} must be a positive integer`);
  }
  return Number(value);
}

function pageQuery(req) {
  const hasLimit = req.query.limit !== undefined;
  const hasOffset = req.query.offset !== undefined;
  const hasQ = typeof req.query.q === 'string' && req.query.q.trim() !== '';
  if (!hasLimit && !hasOffset && !hasQ) return null;

  let limit = Number(req.query.limit);
  if (!Number.isInteger(limit) || limit < 1) limit = 40;
  limit = Math.min(limit, 100);

  let offset = Number(req.query.offset);
  if (!Number.isInteger(offset) || offset < 0) offset = 0;

  const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 80) : '';
  return { limit, offset, q };
}

async function sendList(req, res, model) {
  const page = pageQuery(req);
  if (!page) {
    res.json(await listRecords(model));
    return;
  }
  res.json(await listRecordsPage(model, page));
}

function mountCrud(path, model) {
  const [idAttr] = Object.keys(model.primaryKeys);
  const isInteger = model.rawAttributes[idAttr].type.key === 'INTEGER';

  api.get(path, asyncHandler(async (req, res) => {
    await sendList(req, res, model);
  }));

  api.get(`${path}/:id`, asyncHandler(async (req, res) => {
    const id = isInteger ? integerId(req.params.id, idAttr) : req.params.id;
    const row = await getRecord(model, { [idAttr]: id });
    if (!row) throw httpError(404, 'Not found');
    res.json(row);
  }));

  api.post(path, asyncHandler(async (req, res) => {
    const created = await createRecord(model, requireBody(req));
    res.status(201).json(created);
  }));

  api.put(`${path}/:id`, asyncHandler(async (req, res) => {
    const id = isInteger ? integerId(req.params.id, idAttr) : req.params.id;
    const updated = await updateRecord(model, { [idAttr]: id }, requireBody(req));
    if (!updated) throw httpError(404, 'Not found');
    res.json(updated);
  }));

  api.delete(`${path}/:id`, asyncHandler(async (req, res) => {
    const id = isInteger ? integerId(req.params.id, idAttr) : req.params.id;
    const deleted = await deleteRecord(model, { [idAttr]: id });
    if (!deleted) throw httpError(404, 'Not found');
    res.json({ deleted });
  }));
}

function mountComposite(path, model, keySpecs) {
  const paramPath = `${path}/${keySpecs.map((key) => `:${key.param}`).join('/')}`;

  function whereFrom(req) {
    const where = {};
    for (const key of keySpecs) {
      const raw = req.params[key.param];
      where[key.field] = key.integer ? integerId(raw, key.field) : raw;
    }
    return where;
  }

  api.get(path, asyncHandler(async (req, res) => {
    await sendList(req, res, model);
  }));

  api.get(paramPath, asyncHandler(async (req, res) => {
    const row = await getRecord(model, whereFrom(req));
    if (!row) throw httpError(404, 'Not found');
    res.json(row);
  }));

  api.post(path, asyncHandler(async (req, res) => {
    const created = await createRecord(model, requireBody(req));
    res.status(201).json(created);
  }));

  api.put(paramPath, asyncHandler(async (req, res) => {
    const updated = await updateRecord(model, whereFrom(req), requireBody(req));
    if (!updated) throw httpError(404, 'Not found');
    res.json(updated);
  }));

  api.delete(paramPath, asyncHandler(async (req, res) => {
    const deleted = await deleteRecord(model, whereFrom(req));
    if (!deleted) throw httpError(404, 'Not found');
    res.json({ deleted });
  }));
}

mountCrud('/portal-guns', PortalGun);
mountCrud('/characters', Character);
mountCrud('/humans', Human);
mountCrud('/robots', Robot);
mountCrud('/cakes', Cake);
mountCrud('/shafts', Shaft);
mountCrud('/test-chambers', TestChamber);
mountCrud('/gels', Gel);
mountCrud('/interactables', Interactable);
mountCrud('/surfaces', Surface);
mountCrud('/wiki-articles', WikiArticle);

mountComposite('/portals', Portal, [
  { param: 'portalGunId', field: 'portal_gun_id', integer: true },
  { param: 'color', field: 'Color', integer: false },
]);

mountComposite('/hazards', Hazard, [
  { param: 'chamberId', field: 'chamber_id', integer: true },
  { param: 'type', field: 'type', integer: false },
]);

mountComposite('/prize-cakes', PrizeCake, [
  { param: 'cakeId', field: 'cake_id', integer: true },
  { param: 'humanId', field: 'human_id', integer: true },
]);

mountComposite('/interactable-test-chambers', InteractableTestChamber, [
  { param: 'chamberId', field: 'chamber_id', integer: true },
  { param: 'interactableType', field: 'Interactable_type', integer: false },
]);

api.get('/queries/portal-placements', asyncHandler(async (req, res) => {
  res.json(await getPortalPlacements());
}));

api.get('/views/character-roster', asyncHandler(async (req, res) => {
  const kind = req.query.kind;
  if (kind !== undefined && !['human', 'robot', 'unspecified'].includes(String(kind))) {
    throw httpError(400, "kind must be 'human', 'robot', or 'unspecified'");
  }
  res.json(await getCharacterRoster(kind));
}));

api.get('/procedures/chambers-in-shaft/:shaftId', asyncHandler(async (req, res) => {
  const shaftId = integerId(req.params.shaftId, 'shaft_id');
  const shaft = await getRecord(Shaft, { shaft_id: shaftId });
  if (!shaft) throw httpError(404, 'Shaft not found');
  res.json(await chambersInShaft(shaftId));
}));

api.get('/stats', asyncHandler(async (req, res) => {
  const counts = {};
  let total = 0;
  for (const model of TABLE_MODELS) {
    const count = await model.count();
    counts[model.tableName] = count;
    total += count;
  }
  res.json({ total, counts, llm: llmStatus() });
}));

api.post('/ask', asyncHandler(async (req, res) => {
  const body = requireBody(req);
  res.json(await askAboutData(body.question, body));
}));

api.get('/', (req, res) => {
  res.json({
    name: 'Portal DB API',
    gui: '/',
    crud: [
      '/api/portal-guns',
      '/api/characters',
      '/api/humans',
      '/api/robots',
      '/api/cakes',
      '/api/shafts',
      '/api/test-chambers',
      '/api/gels',
      '/api/interactables',
      '/api/surfaces',
      '/api/wiki-articles',
      '/api/portals',
      '/api/hazards',
      '/api/prize-cakes',
      '/api/interactable-test-chambers',
    ],
    multiJoin: '/api/queries/portal-placements',
    view: '/api/views/character-roster',
    storedProcedure: '/api/procedures/chambers-in-shaft/:shaftId',
    ask: 'POST /api/ask',
    stats: '/api/stats',
  });
});
