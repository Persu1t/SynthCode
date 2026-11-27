import { ContainerModule } from 'inversify';
import { HealthController } from './controllers/HealthController.js';
import { HealthService } from './services/HealthService.js';
import { HEALTH_TYPES } from './types.js';

export const healthContainerModule = new ContainerModule(options => {
  options.bind(HEALTH_TYPES.HealthService).to(HealthService).inSingletonScope();
  options.bind(HealthController).toSelf().inSingletonScope();
});
