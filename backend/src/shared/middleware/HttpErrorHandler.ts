import type { NextFunction, Request, Response } from 'express';
import { injectable } from 'inversify';
import { Middleware, type ExpressErrorMiddlewareInterface } from 'routing-controllers';
import { appConfig } from '../../config/index.js';

/** Turns any error thrown inside a controller into a JSON response. */
@Middleware({ type: 'after' })
@injectable()
export class HttpErrorHandler implements ExpressErrorMiddlewareInterface {
  error(error: any, _req: Request, res: Response, next: NextFunction): void {
    if (res.headersSent) return next(error);

    const status: number = error?.httpCode ?? 500;
    if (status >= 500) console.error(error);

    res.status(status).json({
      error: error?.name ?? 'Error',
      message:
        status >= 500 && appConfig.isProduction
          ? 'Internal server error'
          : (error?.message ?? 'Unexpected error'),
    });
  }
}
