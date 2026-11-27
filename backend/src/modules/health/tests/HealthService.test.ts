import { describe, expect, it } from 'vitest';
import { HealthService } from '../services/HealthService.js';

const config = {
  serviceName: 'synthcode-backend',
  version: '9.9.9',
  env: 'test',
} as ConstructorParameters<typeof HealthService>[0];

describe('HealthService', () => {
  it('reports ok with service metadata', () => {
    const status = new HealthService(config).getStatus();

    expect(status.status).toBe('ok');
    expect(status.service).toBe('synthcode-backend');
    expect(status.version).toBe('9.9.9');
    expect(status.environment).toBe('test');
  });

  it('returns a valid ISO timestamp and a non-negative uptime', () => {
    const status = new HealthService(config).getStatus();

    expect(new Date(status.timestamp).toISOString()).toBe(status.timestamp);
    expect(status.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });
});
