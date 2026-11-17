import { createApp } from './app.js';
import { config } from './config.js';
import { initDatabase } from './init.js';

try {
  await initDatabase();
  const app = createApp();
  app.listen(config.appPort, () => {
    console.log(`Portal API listening on http://localhost:${config.appPort}`);
    console.log(`Schema ${config.database} is ready in MySQL Workbench.`);
  });
} catch (err) {
  const code = err.code || err.original?.code || err.parent?.code;
  if (code === 'ER_ACCESS_DENIED_ERROR') {
    console.error('MySQL access denied. Set DB_USER and DB_PASSWORD in .env, then start the API again.');
  } else if (code === 'ECONNREFUSED') {
    console.error('Could not connect to MySQL. Start the MySQL service and check DB_HOST and DB_PORT in .env.');
  } else {
    console.error(err);
  }
  process.exit(1);
}
