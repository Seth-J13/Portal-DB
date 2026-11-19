import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(root, '.env') });

const database = process.env.DB_NAME || 'portal_db';

if (!/^[A-Za-z0-9_]+$/.test(database)) {
  throw new Error('DB_NAME may contain only letters, numbers, and underscores');
}

export const config = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD ?? '',
  database,
  appPort: Number(process.env.PORT || 3000),
  logSql: process.env.DB_LOG === 'true',
  llm: {
    baseUrl: process.env.LLM_BASE_URL || 'https://api.groq.com/openai/v1',
    apiKey: process.env.LLM_API_KEY || '',
    model: process.env.LLM_MODEL || 'llama-3.3-70b-versatile',
  },
};
