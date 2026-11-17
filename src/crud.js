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
