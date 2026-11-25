import { QueryTypes } from 'sequelize';
import { config } from './config.js';
import { sequelize } from './db.js';
import { httpError } from './errors.js';

const SCHEMA = `
You are writing one read-only MySQL query for the portal_db Enrichment Center database.
Answer from this database only. Ignore outside knowledge of the Portal games when choosing rows.

Tables:
- Gel(type)
- Shafts(shaft_id, era, name) — era is Old or New
- Portal_Guns(portal_gun_id, has_potatos) — has_potatos is 0 or 1
- Interactable(type, description)
- Cake(cake_id, flavor, is_a_lie) — is_a_lie is 0 or 1
- Test_Chambers(chamber_id, shaft_id, name)
- Characters(character_id, name, portal_gun_id)
- Humans(human_id, character_id, sex, assignment) — sex is M or F; a character is a human or a robot, never both
- Robots(robot_id, character_id, type, assignment, description)
- Surface(surface_id, portalable, chamber_id, gel_type) — portalable is 0 or 1; gel_type references Gel.type
- Portals(portal_gun_id, Color, surface_id) — Color is Blue or Orange
- Hazards(chamber_id, type, description)
- Interactable_Test_Chambers(Interactable_type, chamber_id)
- Prize_Cakes(cake_id, human_id)
- Wiki_Articles(page_id, title, kind, language, categories, extract, wiki_url)
- vw_character_roster(character_id, name, portal_gun_id, has_potatos, kind, human_id, sex, human_assignment, robot_id, robot_type, robot_assignment, robot_description)

Wiki_Articles rows were imported from the Portal Wiki (theportalwiki.com).
kind is character, chamber, item, mechanic, gel, or article.
Relationships: a character may hold one portal gun; a gun has up to two portals (Blue and Orange);
a portal sits on a surface; a surface belongs to a test chamber; a chamber belongs to a shaft.

Return JSON only, with no markdown:
{"sql":"SELECT ...","purpose":"one short sentence"}
Use a single SELECT or WITH query. Limit it to 40 rows. If the question is not about this database, return {"sql":null,"purpose":"why"}.
`;

const ANSWER = `
You answer questions about portal_db. Use only the SQL rows in the user message.
If the row list is empty, say that nothing in the database matched. Do not fill gaps from outside knowledge.
Speak in plain sentences. Mention counts and names that appear in the rows.
`;

const ROW_CAP = 40;

export function llmStatus() {
  return {
    configured: Boolean(config.llm.apiKey),
    model: config.llm.model,
    baseUrl: config.llm.baseUrl,
  };
}

function maskStrings(sql) {
  return sql
    .replace(/'(?:\\'|''|[^'])*'/g, "''")
    .replace(/"(?:\\"|[^"])*"/g, '""');
}

export function validateReadSql(input) {
  if (typeof input !== 'string' || !input.trim()) {
    throw httpError(400, 'The model did not return a SQL query');
  }

  let sql = input
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--[^\n]*/g, ' ')
    .trim();

  if (sql.endsWith(';')) sql = sql.slice(0, -1).trim();
  if (sql.includes(';')) {
    throw httpError(400, 'Only one SQL statement is allowed');
  }
  if (!/^(select|with)\b/i.test(sql)) {
    throw httpError(400, 'Only a SELECT query can be run');
  }

  const masked = maskStrings(sql);
  if (/\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|call|load_file|outfile|dumpfile|sleep|benchmark|information_schema|performance_schema|mysql|procedure|trigger|handler|into|lock|unlock|rename|set)\b/i.test(masked)) {
    throw httpError(400, 'That query is not read-only');
  }

  const limit = masked.match(/\blimit\s+(\d+)(\s+offset\s+\d+)?\s*$/i);
  if (!limit) {
    sql = `${sql} LIMIT ${ROW_CAP}`;
  } else if (Number(limit[1]) > ROW_CAP) {
    sql = sql.replace(/\blimit\s+\d+(\s+offset\s+\d+)?\s*$/i, (match) => (
      match.replace(/\blimit\s+\d+/i, `LIMIT ${ROW_CAP}`)
    ));
  }

  return sql;
}

function resolveLlm(body) {
  const baseUrl = String(body?.baseUrl || config.llm.baseUrl || '').trim().replace(/\/$/, '');
  const model = String(body?.model || config.llm.model || '').trim();
  const apiKey = String(body?.apiKey || config.llm.apiKey || '').trim();
  const local = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?(\/|$)/i.test(baseUrl);

  if (!baseUrl || !model) {
    throw httpError(400, 'Set a model and a base URL in Ask settings, or in .env.');
  }
  if (!apiKey && !local) {
    throw httpError(400, 'Add an API key in Ask settings, or set LLM_API_KEY in .env. Groq, OpenAI, and OpenRouter all work. A local Ollama URL does not need a key.');
  }

  return { baseUrl, model, apiKey: apiKey || 'local' };
}

function messageText(content) {
  if (typeof content === 'string') return content.trim();
  if (Array.isArray(content)) {
    return content.map((part) => part?.text || part?.content || '').join('').trim();
  }
  return '';
}

async function complete(llm, messages, temperature) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${llm.apiKey}`,
  };
  if (llm.baseUrl.includes('openrouter.ai')) {
    headers['HTTP-Referer'] = 'http://localhost:3000';
    headers['X-Title'] = 'Portal DB';
  }

  let response;
  try {
    response = await fetch(`${llm.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: llm.model,
        temperature,
        messages,
      }),
      signal: AbortSignal.timeout(45000),
    });
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      throw httpError(504, 'The language model took too long to answer');
    }
    throw httpError(502, 'Could not reach the language model');
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const detail = payload?.error?.message || payload?.message || response.statusText;
    throw httpError(502, `The language model rejected the request: ${detail}`);
  }

  const text = messageText(payload?.choices?.[0]?.message?.content);
  if (!text) throw httpError(502, 'The language model returned an empty response');
  return text;
}

function parseModelJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end <= start) {
    throw httpError(502, 'The language model did not return a query');
  }

  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    throw httpError(502, 'The language model returned invalid JSON');
  }
}

function plainValue(value) {
  if (Buffer.isBuffer(value)) {
    if (value.length === 1) return value[0];
    return null;
  }
  if (typeof value === 'string' && value.length > 400) return `${value.slice(0, 400)}…`;
  return value;
}

function trimRows(rows) {
  return rows.slice(0, ROW_CAP).map((row) => {
    const out = {};
    for (const [key, value] of Object.entries(row)) {
      out[key] = plainValue(value);
    }
    return out;
  });
}

async function runSelect(sql) {
  try {
    const rows = await sequelize.query(sql, { type: QueryTypes.SELECT });
    return trimRows(Array.isArray(rows) ? rows : []);
  } catch (err) {
    const message = err.parent?.sqlMessage || err.sqlMessage || err.message;
    throw httpError(400, message || 'The query failed');
  }
}

export async function askAboutData(question, llmBody) {
  const asked = String(question || '').trim();
  if (!asked) throw httpError(400, 'Enter a question');
  if (asked.length > 1000) throw httpError(400, 'Ask a shorter question');

  const llm = resolveLlm(llmBody || {});
  const messages = [
    { role: 'system', content: SCHEMA },
    { role: 'user', content: asked },
  ];

  let draft = await complete(llm, messages, 0);
  let sql = null;
  let purpose = '';
  let rows = [];

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const parsed = parseModelJson(draft);
    purpose = typeof parsed.purpose === 'string' ? parsed.purpose.slice(0, 300) : '';
    if (!parsed.sql) {
      return {
        answer: purpose || 'Ask a question about the rows in this database.',
        sql: null,
        purpose,
        rows: [],
        rowCount: 0,
      };
    }

    try {
      sql = validateReadSql(String(parsed.sql));
      rows = await runSelect(sql);
      break;
    } catch (err) {
      if (attempt === 1) throw err.status ? err : httpError(400, err.message);
      draft = await complete(llm, [
        ...messages,
        { role: 'assistant', content: draft },
        { role: 'user', content: `That query was rejected (${err.message}). Return corrected JSON only.` },
      ], 0);
    }
  }

  let answer;
  try {
    answer = await complete(llm, [
      { role: 'system', content: ANSWER },
      {
        role: 'user',
        content: `Question: ${asked}\n\nSQL:\n${sql}\n\nRows (${rows.length}):\n${JSON.stringify(rows).slice(0, 24000)}`,
      },
    ], 0.2);
  } catch (err) {
    answer = `The query ran, and ${rows.length} row${rows.length === 1 ? '' : 's'} came back. The model could not explain them: ${err.message}`;
  }

  console.log(`Ask: ${asked}`);
  console.log(`SQL: ${sql}`);

  return {
    answer,
    sql,
    purpose,
    rows,
    rowCount: rows.length,
  };
}
