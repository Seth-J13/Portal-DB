import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { mapError } from './errors.js';
import { api } from './routes.js';

const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use(express.static(publicDir));

  app.use('/api', api);

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use((err, req, res, next) => {
    const mapped = mapError(err);
    if (mapped.status >= 500) {
      console.error(err);
    }
    res.status(mapped.status).json({ error: mapped.message });
  });

  return app;
}
