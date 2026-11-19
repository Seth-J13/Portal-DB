const PAGE = 40;

const RESOURCES = [
  {
    group: 'People',
    id: 'characters',
    path: '/api/characters',
    label: 'Characters',
    hint: 'A character holds at most one portal gun.',
    keys: ['character_id'],
    fields: [
      { name: 'character_id', label: 'ID', type: 'number', auto: true },
      { name: 'name', label: 'Name', type: 'text', required: true, max: 50 },
      {
        name: 'portal_gun_id',
        label: 'Portal gun',
        type: 'number',
        options: 'portal-guns',
        optionValue: (row) => row.portal_gun_id,
        optionLabel: (row) => `Gun ${row.portal_gun_id}${row.has_potatos ? ' · potatos' : ''}`,
      },
    ],
  },
  {
    group: 'People',
    id: 'humans',
    path: '/api/humans',
    label: 'Humans',
    hint: 'One-to-one with a character. Sex is the ERD bit column.',
    keys: ['human_id'],
    fields: [
      { name: 'human_id', label: 'ID', type: 'number', auto: true },
      {
        name: 'character_id',
        label: 'Character',
        type: 'number',
        required: true,
        options: 'characters',
        optionValue: (row) => row.character_id,
        optionLabel: (row) => `${row.character_id} · ${row.name}`,
      },
      { name: 'sex', label: 'Sex', type: 'boolean', required: true, hint: 'Stored as a bit. The seed uses false and true.' },
      { name: 'assignment', label: 'Assignment', type: 'text', required: true, max: 15 },
    ],
  },
  {
    group: 'People',
    id: 'robots',
    path: '/api/robots',
    label: 'Robots',
    hint: 'One-to-one with a character. A character cannot also be a human.',
    keys: ['robot_id'],
    fields: [
      { name: 'robot_id', label: 'ID', type: 'number', auto: true },
      {
        name: 'character_id',
        label: 'Character',
        type: 'number',
        required: true,
        options: 'characters',
        optionValue: (row) => row.character_id,
        optionLabel: (row) => `${row.character_id} · ${row.name}`,
      },
      { name: 'type', label: 'Type', type: 'text', max: 100 },
      { name: 'assignment', label: 'Assignment', type: 'text', required: true, max: 50 },
      { name: 'description', label: 'Description', type: 'textarea', max: 255, truncate: 80 },
    ],
  },
  {
    group: 'People',
    id: 'portal-guns',
    path: '/api/portal-guns',
    label: 'Portal guns',
    hint: 'has_potatos keeps the ERD spelling.',
    keys: ['portal_gun_id'],
    fields: [
      { name: 'portal_gun_id', label: 'ID', type: 'number', auto: true },
      { name: 'has_potatos', label: 'Has potatos', type: 'boolean', required: true },
    ],
  },
  {
    group: 'People',
    id: 'portals',
    path: '/api/portals',
    label: 'Portals',
    hint: 'A gun can place one Blue portal and one Orange portal. Color is checked.',
    keys: ['portal_gun_id', 'Color'],
    fields: [
      {
        name: 'portal_gun_id',
        label: 'Portal gun',
        type: 'number',
        required: true,
        options: 'portal-guns',
        optionValue: (row) => row.portal_gun_id,
        optionLabel: (row) => `Gun ${row.portal_gun_id}`,
      },
      { name: 'Color', label: 'Color', type: 'select', required: true, choices: ['Blue', 'Orange'] },
      {
        name: 'surface_id',
        label: 'Surface',
        type: 'number',
        required: true,
        options: 'surfaces',
        optionValue: (row) => row.surface_id,
        optionLabel: (row) => `Surface ${row.surface_id} · chamber ${row.chamber_id}`,
      },
    ],
  },
  {
    group: 'Facility',
    id: 'shafts',
    path: '/api/shafts',
    label: 'Shafts',
    hint: 'Era is Old or New.',
    keys: ['shaft_id'],
    fields: [
      { name: 'shaft_id', label: 'ID', type: 'number', auto: true },
      { name: 'era', label: 'Era', type: 'select', required: true, choices: ['Old', 'New'] },
    ],
  },
  {
    group: 'Facility',
    id: 'test-chambers',
    path: '/api/test-chambers',
    label: 'Test chambers',
    keys: ['chamber_id'],
    fields: [
      { name: 'chamber_id', label: 'ID', type: 'number', auto: true },
      {
        name: 'shaft_id',
        label: 'Shaft',
        type: 'number',
        required: true,
        options: 'shafts',
        optionValue: (row) => row.shaft_id,
        optionLabel: (row) => `Shaft ${row.shaft_id} · ${row.era}`,
      },
    ],
  },
  {
    group: 'Facility',
    id: 'surfaces',
    path: '/api/surfaces',
    label: 'Surfaces',
    keys: ['surface_id'],
    fields: [
      { name: 'surface_id', label: 'ID', type: 'number', auto: true },
      { name: 'portalable', label: 'Portalable', type: 'boolean', required: true },
      {
        name: 'chamber_id',
        label: 'Chamber',
        type: 'number',
        required: true,
        options: 'test-chambers',
        optionValue: (row) => row.chamber_id,
        optionLabel: (row) => `Chamber ${row.chamber_id}`,
      },
      {
        name: 'gel_type',
        label: 'Gel',
        type: 'text',
        options: 'gels',
        optionValue: (row) => row.type,
        optionLabel: (row) => row.type,
      },
    ],
  },
  {
    group: 'Facility',
    id: 'gels',
    path: '/api/gels',
    label: 'Gels',
    keys: ['type'],
    fields: [
      { name: 'type', label: 'Type', type: 'text', required: true, max: 255 },
    ],
  },
  {
    group: 'Facility',
    id: 'hazards',
    path: '/api/hazards',
    label: 'Hazards',
    hint: 'One chamber can hold several hazards. The key is chamber plus type.',
    keys: ['chamber_id', 'type'],
    fields: [
      {
        name: 'chamber_id',
        label: 'Chamber',
        type: 'number',
        required: true,
        options: 'test-chambers',
        optionValue: (row) => row.chamber_id,
        optionLabel: (row) => `Chamber ${row.chamber_id}`,
      },
      { name: 'type', label: 'Type', type: 'text', required: true, max: 28 },
    ],
  },
  {
    group: 'Equipment',
    id: 'interactables',
    path: '/api/interactables',
    label: 'Interactables',
    keys: ['type'],
    fields: [
      { name: 'type', label: 'Type', type: 'text', required: true, max: 255 },
      { name: 'description', label: 'Description', type: 'textarea', max: 255, truncate: 90 },
    ],
  },
  {
    group: 'Equipment',
    id: 'interactable-test-chambers',
    path: '/api/interactable-test-chambers',
    label: 'Chamber gear',
    hint: 'Which interactables are placed in which chambers.',
    keys: ['chamber_id', 'Interactable_type'],
    fields: [
      {
        name: 'chamber_id',
        label: 'Chamber',
        type: 'number',
        required: true,
        options: 'test-chambers',
        optionValue: (row) => row.chamber_id,
        optionLabel: (row) => `Chamber ${row.chamber_id}`,
      },
      {
        name: 'Interactable_type',
        label: 'Interactable',
        type: 'text',
        required: true,
        options: 'interactables',
        optionValue: (row) => row.type,
        optionLabel: (row) => row.type,
      },
    ],
  },
  {
    group: 'Equipment',
    id: 'cakes',
    path: '/api/cakes',
    label: 'Cakes',
    keys: ['cake_id'],
    fields: [
      { name: 'cake_id', label: 'ID', type: 'number', auto: true },
      { name: 'flavor', label: 'Flavor', type: 'text', required: true, max: 30 },
      { name: 'is_a_lie', label: 'Is a lie', type: 'boolean', required: true },
    ],
  },
  {
    group: 'Equipment',
    id: 'prize-cakes',
    path: '/api/prize-cakes',
    label: 'Prize cakes',
    hint: 'Which human is owed which cake.',
    keys: ['cake_id', 'human_id'],
    fields: [
      {
        name: 'cake_id',
        label: 'Cake',
        type: 'number',
        required: true,
        options: 'cakes',
        optionValue: (row) => row.cake_id,
        optionLabel: (row) => `${row.cake_id} · ${row.flavor}`,
      },
      {
        name: 'human_id',
        label: 'Human',
        type: 'number',
        required: true,
        options: 'humans',
        optionValue: (row) => row.human_id,
        optionLabel: (row) => `Human ${row.human_id}`,
      },
    ],
  },
  {
    group: 'Wiki import',
    id: 'wiki-articles',
    path: '/api/wiki-articles',
    label: 'Wiki articles',
    hint: 'Imported from the Portal Wiki. page_id is the wiki page id.',
    keys: ['page_id'],
    fields: [
      { name: 'page_id', label: 'Page ID', type: 'number', required: true },
      { name: 'title', label: 'Title', type: 'text', required: true, max: 255 },
      { name: 'kind', label: 'Kind', type: 'select', required: true, choices: ['character', 'chamber', 'item', 'mechanic', 'gel', 'article'] },
      { name: 'language', label: 'Language', type: 'text', max: 20 },
      { name: 'categories', label: 'Categories', type: 'text', max: 500, truncate: 72 },
      { name: 'extract', label: 'Lead', type: 'textarea', table: false },
      { name: 'wiki_url', label: 'Wiki URL', type: 'url', required: true, max: 512 },
    ],
  },
];

const EXTRAS = [
  { group: 'Reports', id: 'placements', label: 'Portal placements' },
  { group: 'Reports', id: 'roster', label: 'Character roster' },
  { group: 'Reports', id: 'shaft', label: 'Chambers in a shaft' },
  { group: 'Ask', id: 'ask', label: 'Natural language' },
];

const PROMPTS = [
  'Which characters hold a portal gun, and what color portals does that gun have open?',
  'How many wiki articles are there for each kind?',
  'List the humans and their assignments.',
  'Which test chambers are in a New shaft?',
];

const PRESETS = [
  { label: 'Groq', baseUrl: 'https://api.groq.com/openai/v1', model: 'llama-3.3-70b-versatile' },
  { label: 'OpenAI', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  { label: 'OpenRouter', baseUrl: 'https://openrouter.ai/api/v1', model: 'openai/gpt-4o-mini' },
  { label: 'Ollama', baseUrl: 'http://127.0.0.1:11434/v1', model: 'llama3.2' },
];

const state = {
  view: 'characters',
  page: 0,
  query: '',
  total: 0,
  rows: [],
  stats: null,
  rosterKind: '',
  shaftId: '3',
  ask: { question: '', answer: '', sql: '', purpose: '', rows: [], error: '' },
};

const choiceCache = new Map();
let requestToken = 0;
let toastTimer = 0;

function resourceById(id) {
  return RESOURCES.find((resource) => resource.id === id);
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'open') node.open = true;
    else node.setAttribute(key, String(value));
  }
  for (const child of [].concat(children)) {
    if (child == null || child === false) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}

function toast(message) {
  const node = document.querySelector('#toast');
  node.textContent = message;
  node.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    node.hidden = true;
  }, 3200);
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { error: text.slice(0, 180) };
    }
  }
  if (!response.ok) throw new Error(body?.error || `Request failed (${response.status})`);
  return body;
}

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem('portal-db-llm')) || {};
  } catch {
    return {};
  }
}

function saveSettings(settings) {
  localStorage.setItem('portal-db-llm', JSON.stringify(settings));
}

function formatCount(value) {
  return new Intl.NumberFormat().format(value);
}

function safeUrl(value) {
  try {
    const url = new URL(String(value));
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.href;
  } catch {
    return null;
  }
  return null;
}

function visibleFields(resource) {
  return resource.fields.filter((field) => field.table !== false);
}

async function loadStats() {
  state.stats = await request('/api/stats');
  paintStats();
}

function paintStats() {
  const stats = document.querySelector('#stats');
  const total = state.stats?.total ?? 0;
  const wiki = state.stats?.counts?.Wiki_Articles ?? 0;
  const ready = state.stats?.llm?.configured || Boolean(loadSettings().apiKey);
  stats.replaceChildren(
    el('span', { class: 'chip' }, [el('strong', { text: formatCount(total) }), ' rows']),
    el('span', { class: 'chip' }, [el('strong', { text: formatCount(wiki) }), ' wiki articles']),
    el('span', { class: 'chip', text: ready ? 'Model ready' : 'Model key needed' }),
  );
}

function renderNav() {
  const nav = document.querySelector('#nav');
  nav.replaceChildren();
  const groups = [];
  for (const item of [...RESOURCES, ...EXTRAS]) {
    let group = groups.find((entry) => entry.label === item.group);
    if (!group) {
      group = { label: item.group, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  }

  for (const group of groups) {
    nav.append(el('div', { class: 'group-label', text: group.label }));
    for (const item of group.items) {
      nav.append(el('button', {
        type: 'button',
        class: `nav-btn${item.id === state.view ? ' active' : ''}`,
        text: item.label,
      }));
    }
  }

  // Attach listeners after building so the buttons are real nodes.
  let index = 0;
  for (const button of nav.querySelectorAll('.nav-btn')) {
    const item = groups.flatMap((group) => group.items)[index];
    index += 1;
    button.addEventListener('click', () => show(item.id));
  }
}

function show(view) {
  state.view = view;
  state.page = 0;
  state.query = '';
  state.rows = [];
  state.total = 0;
  closeEditor();
  renderNav();
  renderMain();
}

function renderMain() {
  const main = document.querySelector('#main');
  main.replaceChildren();
  if (state.view === 'ask') renderAsk(main);
  else if (state.view === 'placements') renderPlacements(main);
  else if (state.view === 'roster') renderRoster(main);
  else if (state.view === 'shaft') renderShaft(main);
  else renderResource(main);
}

function sectionHead(title, hint) {
  return el('div', { class: 'heading' }, [
    el('div', {}, [
      el('h2', { text: title }),
      hint ? el('p', { class: 'lede', text: hint }) : null,
    ]),
  ]);
}

function renderResource(main) {
  const resource = resourceById(state.view);
  const wikiEmpty = resource.id === 'wiki-articles' && (state.stats?.counts?.Wiki_Articles ?? 0) === 0;
  main.append(sectionHead(resource.label, resource.hint || 'Create, edit, and delete rows in this table.'));
  if (wikiEmpty) {
    main.append(el('div', {
      class: 'banner',
      text: 'This table is empty. From the project folder, run npm run import to load the Portal Wiki.',
    }));
  }
  const search = el('input', {
    class: 'search',
    type: 'search',
    placeholder: `Search ${resource.label.toLowerCase()}`,
    value: state.query,
    'aria-label': `Search ${resource.label}`,
  });
  search.addEventListener('input', (event) => {
    const value = event.target.value;
    window.clearTimeout(search.timer);
    search.timer = window.setTimeout(() => {
      state.query = value.trim();
      state.page = 0;
      refreshResource();
    }, 250);
  });
  main.append(el('div', { class: 'toolbar' }, [
    search,
    el('button', { type: 'button', class: 'btn primary', text: 'New record' }),
  ]));
  main.querySelector('.primary').addEventListener('click', () => openEditor('create'));
  main.append(el('p', { id: 'status-line', class: 'muted', text: 'Loading…' }));
  main.append(el('div', { class: 'sheet' }, [el('table', {}, [
    el('thead'),
    el('tbody'),
  ])]));
  main.append(el('div', { class: 'pager' }));
  refreshResource();
}

async function refreshResource() {
  const resource = resourceById(state.view);
  if (!resource) return;
  const token = ++requestToken;
  const status = document.querySelector('#status-line');
  if (status) status.textContent = 'Loading…';
  try {
    const params = new URLSearchParams({
      limit: String(PAGE),
      offset: String(state.page * PAGE),
      q: state.query,
    });
    const payload = await request(`${resource.path}?${params}`);
    if (token !== requestToken) return;
    state.rows = payload.data || [];
    state.total = payload.total || 0;
    paintRows();
  } catch (err) {
    if (token !== requestToken) return;
    if (status) status.textContent = err.message;
    toast(err.message);
  }
}

function paintRows() {
  const resource = resourceById(state.view);
  const fields = visibleFields(resource);
  const table = document.querySelector('table');
  if (!table) return;

  const head = el('tr');
  for (const field of fields) {
    head.append(el('th', { class: field.type === 'number' ? 'num' : '', text: field.label }));
  }
  head.append(el('th', { text: '' }));
  table.querySelector('thead').replaceChildren(head);

  const body = table.querySelector('tbody');
  body.replaceChildren();
  for (const row of state.rows) {
    const tr = el('tr', { class: 'clickable' });
    tr.addEventListener('click', () => openEditor('edit', row));
    for (const field of fields) {
      tr.append(renderCell(field, row[field.name]));
    }
    const edit = el('button', { type: 'button', class: 'btn', text: 'Edit' });
    edit.addEventListener('click', (event) => {
      event.stopPropagation();
      openEditor('edit', row);
    });
    tr.append(el('td', {}, [edit]));
    body.append(tr);
  }

  const status = document.querySelector('#status-line');
  const start = state.total === 0 ? 0 : state.page * PAGE + 1;
  const end = Math.min(state.total, (state.page + 1) * PAGE);
  if (status) {
    status.textContent = state.total === 0
      ? (state.query ? 'No rows match that search.' : 'No rows yet.')
      : `Showing ${formatCount(start)}–${formatCount(end)} of ${formatCount(state.total)}.`;
  }

  const prev = el('button', { type: 'button', class: 'btn', text: 'Previous' });
  const next = el('button', { type: 'button', class: 'btn', text: 'Next' });
  prev.disabled = state.page === 0;
  next.disabled = end >= state.total;
  prev.addEventListener('click', () => {
    state.page -= 1;
    refreshResource();
  });
  next.addEventListener('click', () => {
    state.page += 1;
    refreshResource();
  });
  document.querySelector('.pager').replaceChildren(
    el('span', { text: state.total ? `Page ${state.page + 1}` : '' }),
    el('div', {}, [prev, next]),
  );
}

function renderCell(field, value) {
  const td = el('td', { class: field.type === 'number' ? 'num' : '' });
  if (value === null || value === undefined || value === '') {
    td.append(el('span', { class: 'muted', text: '—' }));
    return td;
  }
  if (field.type === 'url') {
    const href = safeUrl(value);
    td.append(href
      ? el('a', { href, target: '_blank', rel: 'noopener noreferrer', text: 'Open' })
      : el('span', { text: String(value) }));
    return td;
  }
  if (field.type === 'boolean') {
    td.textContent = value ? 'Yes' : 'No';
    return td;
  }
  const text = String(value);
  const tag = field.name === 'Color' || field.name === 'era' || field.name === 'kind';
  const shown = field.truncate && text.length > field.truncate ? `${text.slice(0, field.truncate)}…` : text;
  if (tag) td.append(el('span', { class: `tag tag-${text.toLowerCase().replace(/\s+/g, '-')}`, text: shown }));
  else td.textContent = shown;
  if (shown !== text) td.title = text;
  return td;
}

function recordPath(resource, row) {
  const parts = resource.keys.map((key) => encodeURIComponent(row[key]));
  return `${resource.path}/${parts.join('/')}`;
}

async function loadChoices(resourceId) {
  if (choiceCache.has(resourceId)) return choiceCache.get(resourceId);
  const resource = resourceById(resourceId);
  const rows = [];
  let offset = 0;
  while (rows.length < 1000) {
    const payload = await request(`${resource.path}?limit=100&offset=${offset}`);
    const page = payload.data || [];
    rows.push(...page);
    if (page.length < 100) break;
    offset += 100;
  }
  choiceCache.set(resourceId, rows);
  return rows;
}

async function openEditor(mode, row = {}) {
  const resource = resourceById(state.view);
  const choices = {};
  try {
    for (const field of resource.fields) {
      if (field.options) choices[field.name] = await loadChoices(field.options);
    }
  } catch (err) {
    toast(err.message);
    return;
  }
  paintEditor(mode, row, choices);
}

function paintEditor(mode, row, choices) {
  const resource = resourceById(state.view);
  const drawer = document.querySelector('#drawer');
  const form = el('form', { class: 'panel' });
  const close = el('button', { type: 'button', class: 'icon-btn', text: '×', 'aria-label': 'Close' });
  close.addEventListener('click', closeEditor);
  form.append(el('div', { class: 'panel-head' }, [
    el('h3', { text: mode === 'create' ? `New ${resource.label.slice(0, 1).toLowerCase()}${resource.label.slice(1)}` : `Edit ${resource.label.slice(0, 1).toLowerCase()}${resource.label.slice(1)}` }),
    close,
  ]));
  if (mode === 'edit') {
    form.append(el('p', { class: 'hint', text: 'Key fields stay fixed. Delete the row if the key itself is wrong.' }));
  }

  for (const field of resource.fields) {
    if (mode === 'create' && field.auto) continue;
    const locked = mode === 'edit' && (field.auto || resource.keys.includes(field.name));
    form.append(fieldControl(field, row[field.name], choices[field.name] || [], locked));
  }

  const error = el('p', { class: 'form-error', text: '' });
  const save = el('button', { type: 'submit', class: 'btn primary', text: 'Save' });
  const cancel = el('button', { type: 'button', class: 'btn', text: 'Cancel' });
  cancel.addEventListener('click', closeEditor);
  const remove = el('button', { type: 'button', class: 'btn danger', text: 'Delete' });
  remove.addEventListener('click', () => deleteRow(resource, row, error, remove));
  form.append(error, el('div', { class: 'actions' }, [
    mode === 'edit' ? remove : el('span'),
    el('div', {}, [cancel, save]),
  ]));

  form.addEventListener('submit', (event) => saveRow(event, resource, mode, row, error, save));
  drawer.replaceChildren(form);
  drawer.hidden = false;
  const first = form.querySelector('input, select, textarea');
  if (first && !first.disabled) first.focus();
}

function fieldControl(field, value, choices, locked) {
  const label = el('label', { class: 'field' });
  label.append(el('span', { text: field.label }));
  let control;
  const current = value === null || value === undefined ? '' : String(value);

  if (field.options) {
    control = el('select', { name: field.name, required: field.required || false });
    if (!field.required) control.append(el('option', { value: '', text: 'None' }));
    const seen = new Set();
    for (const choice of choices) {
      const optionValue = String(field.optionValue(choice));
      if (seen.has(optionValue)) continue;
      seen.add(optionValue);
      const option = el('option', { value: optionValue, text: field.optionLabel(choice) });
      if (optionValue === current) option.selected = true;
      control.append(option);
    }
    if (current && !seen.has(current)) {
      const extra = el('option', { value: current, text: current });
      extra.selected = true;
      control.append(extra);
    }
  } else if (field.type === 'select') {
    control = el('select', { name: field.name, required: true });
    for (const choice of field.choices) {
      const option = el('option', { value: choice, text: choice });
      if (choice === current) option.selected = true;
      control.append(option);
    }
  } else if (field.type === 'boolean') {
    const selected = value === true || current === 'true' || current === '1' ? 'true' : 'false';
    control = el('select', { name: field.name, required: true });
    for (const [optionValue, text] of [['false', 'No'], ['true', 'Yes']]) {
      const option = el('option', { value: optionValue, text });
      if (optionValue === selected) option.selected = true;
      control.append(option);
    }
  } else if (field.type === 'textarea') {
    control = el('textarea', { name: field.name, rows: '6', required: field.required || false });
    control.value = current;
  } else {
    control = el('input', {
      name: field.name,
      type: field.type === 'number' ? 'number' : field.type === 'url' ? 'url' : 'text',
      required: field.required || false,
      value: current,
    });
    if (field.type === 'number') control.min = '1';
  }

  if (field.max && control.maxLength !== undefined && field.type !== 'number') control.maxLength = field.max;
  if (locked) {
    control.disabled = true;
    if (control.tagName === 'INPUT') control.readOnly = true;
  }
  label.append(control);
  if (field.hint) label.append(el('p', { class: 'hint', text: field.hint }));
  return label;
}

function coerce(field, raw) {
  if (field.type === 'boolean') return raw === 'true';
  if (field.type === 'number') {
    if (raw === '') return null;
    if (!/^\d+$/.test(raw)) throw new Error(`${field.label} must be a whole number`);
    return Number(raw);
  }
  const text = String(raw ?? '').trim();
  if (!text) return field.required ? '' : null;
  return text;
}

async function saveRow(event, resource, mode, row, error, save) {
  event.preventDefault();
  error.textContent = '';
  const body = {};
  try {
    for (const field of resource.fields) {
      if (field.auto) continue;
      if (mode === 'edit' && resource.keys.includes(field.name)) continue;
      const control = event.target.elements[field.name];
      if (!control || control.disabled) continue;
      body[field.name] = coerce(field, control.value);
      if (field.required && (body[field.name] === '' || body[field.name] === null)) {
        throw new Error(`${field.label} is required`);
      }
    }
  } catch (err) {
    error.textContent = err.message;
    return;
  }

  save.disabled = true;
  try {
    if (mode === 'create') {
      await request(resource.path, { method: 'POST', body: JSON.stringify(body) });
      toast('Saved');
    } else {
      await request(recordPath(resource, row), { method: 'PUT', body: JSON.stringify(body) });
      toast('Updated');
    }
    choiceCache.clear();
    closeEditor();
    await loadStats();
    await refreshResource();
  } catch (err) {
    error.textContent = err.message;
    save.disabled = false;
  }
}

async function deleteRow(resource, row, error, button) {
  const label = resource.keys.map((key) => `${key} ${row[key]}`).join(', ');
  if (!window.confirm(`Delete ${resource.label} (${label})?`)) return;
  button.disabled = true;
  try {
    await request(recordPath(resource, row), { method: 'DELETE' });
    choiceCache.clear();
    closeEditor();
    toast('Deleted');
    if (state.rows.length === 1 && state.page > 0) state.page -= 1;
    await loadStats();
    await refreshResource();
  } catch (err) {
    error.textContent = err.message;
    button.disabled = false;
  }
}

function closeEditor() {
  const drawer = document.querySelector('#drawer');
  drawer.hidden = true;
  drawer.replaceChildren();
}

function dataTable(rows) {
  if (!rows.length) return el('p', { class: 'muted', text: 'No rows.' });
  const columns = Object.keys(rows[0]);
  const head = el('tr');
  for (const column of columns) head.append(el('th', { text: column.replaceAll('_', ' ') }));
  const body = el('tbody');
  for (const row of rows) {
    const tr = el('tr');
    for (const column of columns) {
      const value = row[column];
      const td = el('td');
      if (value === null || value === undefined || value === '') td.append(el('span', { class: 'muted', text: '—' }));
      else if (typeof value === 'boolean' || column === 'sex' || column === 'has_potatos' || column === 'portalable' || column === 'is_a_lie') {
        td.textContent = value === true || value === 1 ? 'Yes' : value === false || value === 0 ? 'No' : String(value);
      } else if (typeof value === 'object') td.textContent = JSON.stringify(value);
      else td.textContent = String(value);
      tr.append(td);
    }
    body.append(tr);
  }
  return el('div', { class: 'sheet' }, [el('table', {}, [el('thead', {}, [head]), body])]);
}

function flattenPlacements(rows) {
  const flat = [];
  for (const character of rows) {
    const gun = character.portalGun;
    for (const portal of gun?.portals || []) {
      flat.push({
        character: character.name,
        portal_gun_id: gun.portal_gun_id,
        has_potatos: gun.has_potatos,
        color: portal.Color,
        surface_id: portal.surface?.surface_id ?? null,
        portalable: portal.surface?.portalable ?? null,
        gel: portal.surface?.gel?.type || portal.surface?.gel_type || null,
        chamber_id: portal.surface?.chamber?.chamber_id ?? null,
        shaft_id: portal.surface?.chamber?.shaft?.shaft_id ?? null,
        era: portal.surface?.chamber?.shaft?.era ?? null,
      });
    }
  }
  return flat;
}

async function renderPlacements(main) {
  main.append(sectionHead('Portal placements', 'Characters, the gun they hold, each open portal, and the surface, chamber, and shaft under it.'));
  const slot = el('div');
  main.append(slot);
  slot.append(el('p', { class: 'muted', text: 'Loading…' }));
  try {
    const rows = await request('/api/queries/portal-placements');
    slot.replaceChildren(dataTable(flattenPlacements(rows)));
  } catch (err) {
    slot.replaceChildren(el('div', { class: 'banner error', text: err.message }));
  }
}

async function renderRoster(main) {
  main.append(sectionHead('Character roster', 'Reads the vw_character_roster view: characters, humans, robots, and portal guns.'));
  const select = el('select', { 'aria-label': 'Kind' });
  for (const [value, label] of [['', 'All kinds'], ['human', 'Humans'], ['robot', 'Robots'], ['unspecified', 'Unspecified']]) {
    const option = el('option', { value, text: label });
    if (value === state.rosterKind) option.selected = true;
    select.append(option);
  }
  const slot = el('div');
  select.addEventListener('change', () => {
    state.rosterKind = select.value;
    loadRoster(slot);
  });
  main.append(el('div', { class: 'filters' }, [el('label', {}, ['Kind', select])]), slot);
  loadRoster(slot);
}

async function loadRoster(slot) {
  slot.replaceChildren(el('p', { class: 'muted', text: 'Loading…' }));
  try {
    const path = state.rosterKind
      ? `/api/views/character-roster?kind=${encodeURIComponent(state.rosterKind)}`
      : '/api/views/character-roster';
    slot.replaceChildren(dataTable(await request(path)));
  } catch (err) {
    slot.replaceChildren(el('div', { class: 'banner error', text: err.message }));
  }
}

function renderShaft(main) {
  main.append(sectionHead('Chambers in a shaft', 'Calls the stored procedure sp_chambers_in_shaft. Shaft 3 is the seeded example.'));
  const input = el('input', { type: 'number', min: '1', value: state.shaftId, 'aria-label': 'Shaft id' });
  const button = el('button', { type: 'button', class: 'btn primary', text: 'Run' });
  const slot = el('div');
  async function run() {
    state.shaftId = input.value;
    button.disabled = true;
    slot.replaceChildren(el('p', { class: 'muted', text: 'Loading…' }));
    try {
      slot.replaceChildren(dataTable(await request(`/api/procedures/chambers-in-shaft/${encodeURIComponent(input.value)}`)));
    } catch (err) {
      slot.replaceChildren(el('div', { class: 'banner error', text: err.message }));
    } finally {
      button.disabled = false;
    }
  }
  button.addEventListener('click', run);
  main.append(el('div', { class: 'filters' }, [
    el('label', {}, ['Shaft', input]),
    button,
  ]), slot);
  run();
}

function renderAsk(main) {
  const saved = loadSettings();
  const baseDefault = saved.baseUrl || state.stats?.llm?.baseUrl || PRESETS[0].baseUrl;
  const modelDefault = saved.model || state.stats?.llm?.model || PRESETS[0].model;
  main.append(sectionHead(
    'Ask the database',
    'The model writes a SELECT, MySQL runs it, and the reply is written from those rows. It is not answering from memory of the games.',
  ));

  const question = el('textarea', { name: 'question', required: true, placeholder: 'Ask about the facility or the imported wiki…' });
  question.value = state.ask.question;
  const prompts = el('div', { class: 'prompts' });
  for (const prompt of PROMPTS) {
    const button = el('button', { type: 'button', class: 'prompt', text: prompt });
    button.addEventListener('click', () => {
      question.value = prompt;
      question.focus();
    });
    prompts.append(button);
  }

  const baseUrl = el('input', { name: 'baseUrl', type: 'url', value: baseDefault, required: true, 'aria-label': 'API base URL' });
  const model = el('input', { name: 'model', type: 'text', value: modelDefault, required: true, 'aria-label': 'Model' });
  const apiKey = el('input', {
    name: 'apiKey',
    type: 'password',
    value: saved.apiKey || '',
    placeholder: 'Leave blank to use LLM_API_KEY from .env',
    autocomplete: 'off',
    'aria-label': 'API key',
  });
  const presetRow = el('div', { class: 'prompts' });
  for (const preset of PRESETS) {
    const button = el('button', { type: 'button', class: 'prompt', text: preset.label });
    button.addEventListener('click', () => {
      baseUrl.value = preset.baseUrl;
      model.value = preset.model;
    });
    presetRow.append(button);
  }
  const needsKey = !saved.apiKey && !state.stats?.llm?.configured;
  const settings = el('details', { class: 'settings', open: needsKey || false }, [
    el('summary', { text: 'Model settings' }),
    el('div', { class: 'grid' }, [
      presetRow,
      el('label', { class: 'field' }, [el('span', { text: 'Base URL' }), baseUrl]),
      el('label', { class: 'field' }, [el('span', { text: 'Model' }), model]),
      el('label', { class: 'field' }, [el('span', { text: 'API key' }), apiKey]),
      el('p', { class: 'hint', text: 'The key stays in this browser and is sent only to your local server. A local Ollama URL does not need one.' }),
    ]),
  ]);

  const submit = el('button', { type: 'submit', class: 'btn primary', text: 'Ask' });
  const form = el('form', { class: 'ask-box' }, [
    question,
    prompts,
    settings,
    submit,
  ]);
  const output = el('div', { id: 'ask-output' });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const settingsBody = {
      baseUrl: baseUrl.value.trim(),
      model: model.value.trim(),
      apiKey: apiKey.value.trim(),
    };
    saveSettings(settingsBody);
    paintStats();
    state.ask.question = question.value.trim();
    state.ask.error = '';
    state.ask.answer = '';
    state.ask.sql = '';
    state.ask.rows = [];
    submit.disabled = true;
    submit.textContent = 'Asking…';
    paintAsk(output);
    try {
      const result = await request('/api/ask', {
        method: 'POST',
        body: JSON.stringify({ question: state.ask.question, ...settingsBody }),
      });
      state.ask.answer = result.answer || '';
      state.ask.sql = result.sql || '';
      state.ask.purpose = result.purpose || '';
      state.ask.rows = result.rows || [];
    } catch (err) {
      state.ask.error = err.message;
    } finally {
      submit.disabled = false;
      submit.textContent = 'Ask';
      paintAsk(output);
    }
  });
  main.append(form, output);
  paintAsk(output);
}

function paintAsk(output) {
  output.replaceChildren();
  if (state.ask.error) output.append(el('div', { class: 'banner error', text: state.ask.error }));
  if (!state.ask.answer && !state.ask.sql && !state.ask.error) return;
  if (state.ask.answer) output.append(el('div', { class: 'answer', text: state.ask.answer }));
  if (state.ask.purpose) output.append(el('p', { class: 'hint', text: state.ask.purpose }));
  if (state.ask.sql) {
    output.append(el('h3', { text: 'Query sent to MySQL' }));
    output.append(el('pre', { class: 'sql', text: state.ask.sql }));
  }
  if (state.ask.sql) {
    output.append(el('h3', { text: `Rows returned (${state.ask.rows.length})` }));
    output.append(dataTable(state.ask.rows));
  }
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeEditor();
});

document.querySelector('#drawer').addEventListener('click', (event) => {
  if (event.target.id === 'drawer') closeEditor();
});

async function init() {
  renderNav();
  renderMain();
  try {
    await loadStats();
  } catch (err) {
    toast(err.message);
  }
}

init();
