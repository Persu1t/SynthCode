import { inject, injectable } from 'inversify';
import type { AppConfig } from '../../../config/index.js';
import { GLOBAL_TYPES } from '../../../types.js';
import type { HealthStatus } from '../interfaces/HealthStatus.js';

@injectable()
export class HealthService {
  constructor(@inject(GLOBAL_TYPES.AppConfig) private readonly config: AppConfig) {}

  getStatus(): HealthStatus {
    return {
      status: 'ok',
      service: this.config.serviceName,
      version: this.config.version,
      environment: this.config.env,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
