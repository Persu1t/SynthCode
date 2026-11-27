import type { ContainerModule } from 'inversify';
import { sharedContainerModule } from '../../container.js';
import { HealthController } from './controllers/HealthController.js';
import { healthContainerModule } from './container.js';

// Export names that loadAppModules() looks for.
export const healthModuleControllers: Function[] = [HealthController];
export const healthModuleValidators: Function[] = [];
export const healthContainerModules: ContainerModule[] = [
  healthContainerModule,
  sharedContainerModule,
];

export * from './controllers/HealthController.js';
export * from './services/HealthService.js';
export * from './interfaces/HealthStatus.js';
export * from './types.js';
