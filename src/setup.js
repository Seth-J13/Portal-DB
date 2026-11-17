import { closeDatabase, initDatabase } from './init.js';
import { verifyDatabase } from './smoke.js';

try {
  await initDatabase({ force: true });
  const summary = await verifyDatabase();
  console.log('portal_db is created, constrained, and populated.');
  console.log(JSON.stringify(summary.counts, null, 2));
  console.log(`Join rows: ${summary.placements}. Roster rows: ${summary.roster}. Shaft 3 chambers: ${summary.chambers.length}.`);
} catch (err) {
  const code = err.code || err.original?.code || err.parent?.code;
  if (code === 'ER_ACCESS_DENIED_ERROR') {
    console.error('MySQL access denied. Set DB_USER and DB_PASSWORD in .env, then run npm run setup again.');
  } else if (code === 'ECONNREFUSED') {
    console.error('Could not connect to MySQL. Start the MySQL service and check DB_HOST and DB_PORT in .env.');
  } else {
    console.error(err);
  }
  process.exitCode = 1;
} finally {
  try {
    await closeDatabase();
  } catch {
    // The pool may never have opened.
  }
}
