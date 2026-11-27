import { inject, injectable } from 'inversify';
import { Get, JsonController } from 'routing-controllers';
import { HEALTH_TYPES } from '../types.js';
import { HealthService } from '../services/HealthService.js';
import type { HealthStatus } from '../interfaces/HealthStatus.js';

@JsonController('/health')
@injectable()
export class HealthController {
  constructor(@inject(HEALTH_TYPES.HealthService) private readonly healthService: HealthService) {}

  /** GET /api/health: used by the frontend status pill, Docker and CI. */
  @Get('/')
  getHealth(): HealthStatus {
    return this.healthService.getStatus();
  }
}
