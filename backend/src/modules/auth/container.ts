import { ContainerModule } from 'inversify';
import { AUTH_TYPES } from './types.js';
import { AuthService } from './service/AuthService.js';
import { AuthController } from './controller/AuthController.js';
import { AuthMiddleware } from './middleware/AuthMiddleware.js';

export const authContainerModule = new ContainerModule(options => {
  options.bind(AUTH_TYPES.AuthService).to(AuthService).inSingletonScope();
  options.bind(AuthController).toSelf().inSingletonScope();
  options.bind(AuthMiddleware).toSelf().inSingletonScope();
});
