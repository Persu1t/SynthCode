import { appConfig } from '../config/index.js';

export function printStartupSummary(): void {
  const base = `http://localhost:${appConfig.port}${appConfig.routePrefix}`;
  console.log(
    [
      '',
      `  ${appConfig.serviceName} v${appConfig.version}`,
      `  environment : ${appConfig.env}`,
      `  modules     : ${appConfig.module}`,
      `  health      : ${base}/health`,
      '',
    ].join('\n'),
  );
}
