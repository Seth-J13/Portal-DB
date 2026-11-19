import { closeDatabase, initDatabase } from './init.js';
import {
  Character,
  Gel,
  Interactable,
  Robot,
  WikiArticle,
} from './models.js';
import { eachWikiBatch } from './wiki.js';

function robotAssignment(article) {
  const blob = `${article.title} ${article.categories || ''}`.toLowerCase();
  if (blob.includes('turret')) return 'Chamber Defense';
  if (blob.includes('core')) return 'Personality Core';
  if (blob.includes('android')) return 'Co-op Testing';
  return 'Facility Robot';
}

function isRobotArticle(article) {
  const blob = `${article.title} ${article.categories || ''}`.toLowerCase();
  return /turret|robot|android|personality core|\bcore\b|glados|wheatley/.test(blob);
}

async function rememberNames() {
  const rows = await Character.findAll({ attributes: ['name'] });
  return new Set(rows.map((row) => row.name.toLowerCase()));
}

async function addCharacters(names) {
  const articles = await WikiArticle.findAll({ where: { kind: 'character' } });
  let characters = 0;
  let robots = 0;

  for (const article of articles) {
    const name = article.title.trim();
    if (!name || name.length > 50 || names.has(name.toLowerCase())) continue;

    try {
      const character = await Character.create({ name, portal_gun_id: null });
      names.add(name.toLowerCase());
      characters += 1;

      if (!isRobotArticle(article)) continue;

      await Robot.create({
        character_id: character.character_id,
        type: name.slice(0, 100),
        assignment: robotAssignment(article),
        description: article.extract ? article.extract.slice(0, 255) : null,
      });
      robots += 1;
    } catch (err) {
      console.warn(`Skipped character "${name}": ${err.message}`);
    }
  }

  return { characters, robots };
}

async function addItems() {
  const articles = await WikiArticle.findAll({ where: { kind: 'item' } });
  let items = 0;

  for (const article of articles) {
    const type = article.title.trim().slice(0, 255);
    if (!type) continue;
    const existing = await Interactable.findOne({ where: { type } });
    if (existing) continue;

    try {
      await Interactable.create({
        type,
        description: article.extract ? article.extract.slice(0, 255) : null,
      });
      items += 1;
    } catch (err) {
      console.warn(`Skipped item "${type}": ${err.message}`);
    }
  }

  return items;
}

async function addGels() {
  const articles = await WikiArticle.findAll({ where: { kind: 'gel' } });
  let gels = 0;

  for (const article of articles) {
    const type = article.title.trim().slice(0, 255);
    if (!type) continue;
    const existing = await Gel.findOne({ where: { type } });
    if (existing) continue;

    try {
      await Gel.create({ type });
      gels += 1;
    } catch (err) {
      console.warn(`Skipped gel "${type}": ${err.message}`);
    }
  }

  return gels;
}

try {
  await initDatabase();
  console.log('Reading articles from https://theportalwiki.com …');

  let written = 0;
  const seen = await eachWikiBatch(async (batch, total) => {
    if (batch.length === 0) return;
    await WikiArticle.bulkCreate(batch, {
      updateOnDuplicate: ['title', 'kind', 'language', 'categories', 'extract', 'wiki_url'],
    });
    written = total;
    if (total % 100 < batch.length) {
      console.log(`  ${total} articles`);
    }
  });

  console.log(`Saved ${written} wiki articles (${seen} fetched).`);

  const names = await rememberNames();
  const people = await addCharacters(names);
  const items = await addItems();
  const gels = await addGels();
  const wikiCount = await WikiArticle.count();

  console.log(`Wiki_Articles: ${wikiCount}`);
  console.log(`New characters: ${people.characters} (${people.robots} robots)`);
  console.log(`New interactables: ${items}`);
  console.log(`New gels: ${gels}`);

  if (wikiCount < 2000) {
    throw new Error(`Expected at least 2000 wiki articles, received ${wikiCount}`);
  }

  const sample = await WikiArticle.findOne({ where: { title: 'Chell' } });
  if (sample) {
    console.log(`Sample: ${sample.title} — ${sample.wiki_url}`);
  }
  console.log('Import finished.');
} catch (err) {
  console.error(err.message || err);
  process.exitCode = 1;
} finally {
  try {
    await closeDatabase();
  } catch {
    // The pool may never have opened.
  }
}
