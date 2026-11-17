export function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

export function mapError(err) {
  if (err.status) {
    return { status: err.status, message: err.message };
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const detail = err.errors?.map((item) => item.message).join('; ');
    return { status: 409, message: detail || 'Unique constraint violated' };
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return {
      status: 409,
      message: 'Referenced row is missing, or another row still points at this one',
    };
  }

  if (err.name === 'SequelizeValidationError') {
    const detail = err.errors?.map((item) => item.message).join('; ');
    return { status: 400, message: detail || 'Validation failed' };
  }

  const errno = err.parent?.errno ?? err.errno;
  const sqlMessage = err.parent?.sqlMessage ?? err.sqlMessage;

  if (errno === 3819) {
    return { status: 400, message: sqlMessage || 'Check constraint violated' };
  }

  if (errno === 1062) {
    return { status: 409, message: sqlMessage || 'Unique constraint violated' };
  }

  if (errno === 1451 || errno === 1452) {
    return {
      status: 409,
      message: sqlMessage || 'Foreign key constraint violated',
    };
  }

  if (err.code === 'ER_ACCESS_DENIED_ERROR' || err.original?.code === 'ER_ACCESS_DENIED_ERROR') {
    return {
      status: 500,
      message: 'MySQL access denied. Set DB_USER and DB_PASSWORD in .env.',
    };
  }

  return { status: 500, message: 'Internal server error' };
}
