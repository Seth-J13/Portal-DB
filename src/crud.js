import { Op } from 'sequelize';

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

export async function listRecordsPage(model, { limit, offset, q }) {
  const result = await model.findAndCountAll({
    where: searchWhere(model, q),
    order: orderByPrimaryKey(model),
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
