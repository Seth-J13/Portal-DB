const API = 'https://theportalwiki.com/w/api.php';
const USER_AGENT = 'portal-db-class-project/1.0 (Enrichment Center database import)';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function classifyArticle(title, categories) {
  const blob = `${title} ${categories}`.toLowerCase();
  if (blob.includes('character')) return 'character';
  if (blob.includes('test chamber')) return 'chamber';
  if (/\bgel\b/.test(blob)) return 'gel';
  if (blob.includes('item')) return 'item';
  if (blob.includes('mechanic')) return 'mechanic';
  return 'article';
}

export function leadText(wikitext) {
  if (!wikitext) return null;

  let text = String(wikitext).replace(/\r/g, '');
  text = text.replace(/<ref\b[^>]*>[\s\S]*?<\/ref>/gi, ' ');
  text = text.replace(/<ref\b[^>]*\/>/gi, ' ');
  text = text.replace(/\[\[(?:File|Image):[\s\S]*?\]\]/gi, ' ');

  for (let pass = 0; pass < 8; pass += 1) {
    const next = text.replace(/\{\{[^{}]*\}\}/g, ' ');
    if (next === text) break;
    text = next;
  }
  text = text.replace(/\{\{[\s\S]*?\}\}/g, ' ');

  text = text.replace(/\[\[(?:[^|\]]+\|)?([^\]]+)\]\]/g, '$1');
  text = text.replace(/\[https?:\/\/[^\s\]]+\s+([^\]]+)\]/gi, '$1');
  text = text.replace(/\[https?:\/\/[^\]]+\]/gi, ' ');
  text = text.replace(/'{2,}/g, '');
  text = text.replace(/<[^>]+>/g, ' ');
  text = text.replace(/&nbsp;/gi, ' ');
  text = text.replace(/&amp;/gi, '&');
  text = text.replace(/\s+/g, ' ').trim();

  if (!text) return null;
  return text.slice(0, 1200);
}

function clip(value, max) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  return text.length > max ? text.slice(0, max) : text;
}

function toArticle(page) {
  if (!page || page.missing || !Number.isInteger(page.pageid) || !page.title) return null;

  const title = String(page.title).trim();
  if (!title || title.startsWith('/')) return null;

  const categories = (page.categories || [])
    .map((category) => String(category.title || '').replace(/^Category:/i, ''))
    .filter(Boolean);

  const categoryText = clip(categories.join(', '), 500);
  const content = page.revisions?.[0]?.slots?.main?.content || '';
  const url = page.canonicalurl
    || `https://theportalwiki.com/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;

  return {
    page_id: page.pageid,
    title: title.slice(0, 255),
    kind: classifyArticle(title, categoryText || ''),
    language: clip(page.pagelanguage, 20),
    categories: categoryText,
    extract: leadText(content),
    wiki_url: String(url).slice(0, 512),
  };
}

async function query(params) {
  const url = new URL(API);
  const full = { format: 'json', formatversion: '2', maxlag: '5', ...params };
  for (const [key, value] of Object.entries(full)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    });

    if (response.status === 429 || response.status >= 500) {
      await sleep(400 * attempt);
      continue;
    }

    if (!response.ok) {
      throw new Error(`Portal Wiki API returned HTTP ${response.status}`);
    }

    const payload = await response.json();
    if (payload.error?.code === 'maxlag') {
      await sleep(2000);
      continue;
    }
    if (payload.error) {
      throw new Error(payload.error.info || 'Portal Wiki API error');
    }
    return payload;
  }

  throw new Error('Portal Wiki API did not respond');
}

async function listAllPages() {
  const pages = [];
  let apcontinue = '';

  do {
    const payload = await query({
      action: 'query',
      list: 'allpages',
      apnamespace: '0',
      apfilterredir: 'nonredirects',
      aplimit: '500',
      apcontinue,
    });
    for (const page of payload.query?.allpages || []) {
      if (page?.title && !String(page.title).startsWith('/')) pages.push(page);
    }
    apcontinue = payload.continue?.apcontinue || '';
    if (apcontinue) await sleep(60);
  } while (apcontinue);

  return pages;
}

async function fetchDetailsOnce(slice) {
  const merged = new Map();
  let extra = null;

  for (let hop = 0; hop < 6; hop += 1) {
    const params = {
      action: 'query',
      pageids: slice.map((page) => page.pageid).join('|'),
      prop: 'revisions|categories|info',
      rvprop: 'content',
      rvslots: 'main',
      rvsection: '0',
      inprop: 'url',
      cllimit: 'max',
    };
    if (extra) Object.assign(params, extra);

    const payload = await query(params);
    for (const page of payload.query?.pages || []) {
      const current = merged.get(page.pageid) || {
        pageid: page.pageid,
        title: page.title,
        categories: [],
      };
      if (page.title) current.title = page.title;
      if (page.missing) current.missing = true;
      if (page.pagelanguage) current.pagelanguage = page.pagelanguage;
      if (page.canonicalurl) current.canonicalurl = page.canonicalurl;
      if (page.revisions) current.revisions = page.revisions;

      const seen = new Set(current.categories.map((category) => category.title));
      for (const category of page.categories || []) {
        if (!seen.has(category.title)) {
          seen.add(category.title);
          current.categories.push(category);
        }
      }
      merged.set(page.pageid, current);
    }

    if (!payload.continue) break;
    extra = payload.continue;
  }

  return [...merged.values()];
}

async function fetchDetails(slice) {
  try {
    return await fetchDetailsOnce(slice);
  } catch (err) {
    if (slice.length === 1) throw err;
    const mid = Math.ceil(slice.length / 2);
    const left = await fetchDetails(slice.slice(0, mid));
    const right = await fetchDetails(slice.slice(mid));
    return [...left, ...right];
  }
}

export async function eachWikiBatch(onBatch) {
  const pages = await listAllPages();
  console.log(`Found ${pages.length} wiki pages. Downloading leads…`);

  const size = 12;
  let seen = 0;
  for (let index = 0; index < pages.length; index += size) {
    const detailed = await fetchDetails(pages.slice(index, index + size));
    const batch = [];
    const ids = new Set();
    for (const page of detailed) {
      const article = toArticle(page);
      if (!article || ids.has(article.page_id)) continue;
      ids.add(article.page_id);
      batch.push(article);
    }
    seen += batch.length;
    await onBatch(batch, seen);
    await sleep(70);
  }

  return seen;
}
