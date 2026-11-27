import {env} from '../utils/env.js';

export const dbConfig = {
  dbUri: env('DB_URL'),
  dbName: env('DB_NAME') || 'synth-db',
};