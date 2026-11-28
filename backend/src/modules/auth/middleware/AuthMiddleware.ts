import type { Request, Response, NextFunction } from 'express';
import { ExpressMiddlewareInterface, UnauthorizedError } from 'routing-controllers';
import { injectable } from 'inversify';
import { verifyToken } from '../utils/crypto.js';

export interface AuthenticatedRequest extends Request {
  authUser?: { id: string; email: string; role: string };
}

@injectable()
export class AuthMiddleware implements ExpressMiddlewareInterface {
  use(request: AuthenticatedRequest, _response: Response, next: NextFunction): void {
    try {
      const authorization = request.headers.authorization;
      if (!authorization?.startsWith('Bearer ')) throw new Error('Missing bearer token');
      const payload = verifyToken(authorization.slice(7));
      if (payload.type !== 'access') throw new Error('Access token required');
      request.authUser = { id: payload.sub, email: payload.email, role: payload.role };
      next();
    } catch {
      next(new UnauthorizedError('Invalid or expired access token'));
    }
  }
}
