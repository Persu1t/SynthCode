import 'reflect-metadata';
import express from 'express';
import { useExpressServer } from 'routing-controllers';
import { appConfig } from './config/index.js';
import { loadAppModules } from './bootstrap/loadModules.js';
import { HttpErrorHandler, loggingHandler } from './shared/index.js';

/** Builds the Express app. Kept separate from index.ts so tests can import it. */
export async function createApp(): Promise<express.Express> {
  const app = express();

  // Every route serves live data, so never answer with 304 Not Modified.
  app.disable('etag');

  if (!appConfig.isProduction || process.env.LOG_REQUESTS === 'true') {
    app.use(loggingHandler);
  }

  const { controllers } = await loadAppModules(appConfig.module);

  useExpressServer(app, {
    controllers,
    middlewares: [HttpErrorHandler],
    routePrefix: appConfig.routePrefix,
    defaultErrorHandler: false,
    validation: true,
    development: appConfig.isDevelopment,
    cors: {
      origin: appConfig.origins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true,
    },
  });

  // Anything the controllers did not handle. routing-controllers calls next() even after
  // it has answered, so only respond if nothing has been sent yet.
  app.use((req, res) => {
    if (res.headersSent) return;
    res.status(404).json({ error: 'NotFound', message: `No route for ${req.method} ${req.path}` });
  });

  return app;
}
