import { Op, literal } from 'sequelize';

/**
 * CRUD goes through Sequelize models.
 * `where` is a primary-key lookup. Single-column keys use one field.
 * Composite keys pass every key column.
 */

function primaryKeyNames(model) {
  return Object.keys(model.primaryKeys);
}

function orderByPrimaryKey(model) {
  return primaryKeyNames(model).map((key) => [key, 'ASC']);
}

const RELATED_NAME_SORT = {
  Humans: { character_id: ['Characters', 'character_id', 'name'] },
  Robots: { character_id: ['Characters', 'character_id', 'name'] },
  Test_Chambers: { shaft_id: ['Shafts', 'shaft_id', 'name'] },
  Surface: { chamber_id: ['Test_Chambers', 'chamber_id', 'name'] },
  Hazards: { chamber_id: ['Test_Chambers', 'chamber_id', 'name'] },
  Interactable_Test_Chambers: { chamber_id: ['Test_Chambers', 'chamber_id', 'name'] },
};

function orderFor(model, sort, dir) {
  const direction = dir === 'DESC' ? 'DESC' : 'ASC';
  const column = typeof sort === 'string' && /^[A-Za-z_][A-Za-z0-9_]*$/.test(sort) ? sort : '';
  const related = RELATED_NAME_SORT[model.tableName]?.[column];
  if (related) {
    const [otherTable, otherKey, otherField] = related;
    const expr = `(SELECT \`${otherField}\` FROM \`${otherTable}\` AS sort_ref WHERE sort_ref.\`${otherKey}\` = \`${model.name}\`.\`${column}\`)`;
    return [[literal(expr), direction], ...orderByPrimaryKey(model)];
  }
  if (column && model.rawAttributes[column]) {
    return [[column, direction], ...orderByPrimaryKey(model).filter(([key]) => key !== column)];
  }
  return orderByPrimaryKey(model);
}

function withoutPrimaryKey(model, data) {
  const patch = { ...data };
  for (const key of primaryKeyNames(model)) {
    delete patch[key];
  }
  return patch;
}

export function createRecord(model, data) {
  return model.create(data);
}

export function listRecords(model) {
  return model.findAll({ order: orderByPrimaryKey(model) });
}

function searchWhere(model, q) {
  if (!q) return undefined;

  const like = `%${q.replace(/[\\%_]/g, '\\$&')}%`;
  const ors = [];

  const numeric = /^\d+$/.test(q);

  for (const [name, attr] of Object.entries(model.rawAttributes)) {
    const type = attr.type?.key;
    if (type === 'STRING' || type === 'TEXT' || type === 'CHAR') {
      ors.push({ [name]: { [Op.like]: like } });
    } else if (numeric && type === 'INTEGER') {
      ors.push({ [name]: Number(q) });
    }
  }

  if (ors.length === 0) return undefined;
  return { [Op.or]: ors };
}

export async function listRecordsPage(model, { limit, offset, q, sort, dir }) {
  const result = await model.findAndCountAll({
    where: searchWhere(model, q),
    order: orderFor(model, sort, dir),
    limit,
    offset,
  });

  return {
    data: result.rows,
    total: result.count,
    limit,
    offset,
  };
}

export function getRecord(model, where) {
  return model.findOne({ where });
}

export async function updateRecord(model, where, data) {
  const row = await model.findOne({ where });
  if (!row) return null;
  await row.update(withoutPrimaryKey(model, data));
  return row;
}

export async function deleteRecord(model, where) {
  return model.destroy({ where });
}
