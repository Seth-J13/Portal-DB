import mysql from 'mysql2/promise';
import { Sequelize } from 'sequelize';
import { config } from './config.js';

export const sequelize = new Sequelize(config.database, config.user, config.password, {
  host: config.host,
  port: config.port,
  dialect: 'mysql',
  logging: config.logSql ? (sql) => console.log(sql) : false,
  define: {
    timestamps: false,
    freezeTableName: true,
  },
});

export async function ensureDatabase() {
  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
  });

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await connection.end();
  }
}
