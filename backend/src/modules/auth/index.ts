import type { ContainerModule } from 'inversify';
import { AuthController } from './controller/AuthController.js';
import { authContainerModule } from './container.js';

export const authModuleControllers: Function[] = [AuthController];
export const authModuleValidators: Function[] = [];
export const authContainerModules: ContainerModule[] = [authContainerModule];

export * from './interfaces/IAuthService.js';
export * from './classes/validators/AuthValidators.js';
export * from './service/AuthService.js';
