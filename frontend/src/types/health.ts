/** Mirrors backend/src/modules/health/interfaces/HealthStatus.ts */
export interface HealthStatus {
  status: 'ok';
  service: string;
  version: string;
  environment: string;
  uptimeSeconds: number;
  timestamp: string;
}
