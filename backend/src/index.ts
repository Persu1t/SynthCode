import 'reflect-metadata';
import http from 'node:http';
import { appConfig, dbConfig } from './config/index.js';
import { createApp } from './app.js';
import { getContainer } from './bootstrap/loadModules.js';
import { MongoDatabase } from './shared/index.js';
import { GLOBAL_TYPES } from './types.js';
import { printStartupSummary } from './utils/logDetails.js';

const app = await createApp();

/**
 * Connects to MongoDB before the server starts accepting requests, and stops with a clear
 * message if it can't. Set SKIP_DB_CONNECTION=true to run without a database.
 */
async function connectDatabase(): Promise<MongoDatabase | null> {
  if (process.env.SKIP_DB_CONNECTION === 'true') {
    console.log('[MongoDatabase] Skipped (SKIP_DB_CONNECTION=true)');
    return null;
  }

  if (!dbConfig.dbUri) {
    console.error('[MongoDatabase] DB_URL is not set. Add it to backend/.env (see .env.example).');
    process.exit(1);
  }

  try {
    const db = getContainer().get<MongoDatabase>(GLOBAL_TYPES.Database);
    await db.init();
    return db;
  } catch (error) {
    // Only the error message is printed, never the connection string (it contains the password).
    console.error(`[MongoDatabase] Could not connect: ${(error as Error).message}`);
    process.exit(1);
  }
}

const db = await connectDatabase();
const server = http.createServer(app);

server.listen(appConfig.port, () => {
  printStartupSummary();
});

function shutdown(signal: string): void {
  console.log(`${signal} received, closing server`);
  server.close(async () => {
    await db?.disconnect();
    process.exit(0);
  });
  // Force exit if connections linger.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
