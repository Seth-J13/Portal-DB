import express from 'express';
import { mapError } from './errors.js';
import { api } from './routes.js';

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get('/', (req, res) => {
    res.json({
      name: 'Portal DB API',
      health: '/api',
    });
  });

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
