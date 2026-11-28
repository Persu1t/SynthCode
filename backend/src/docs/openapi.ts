import { getMetadataArgsStorage } from 'routing-controllers';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import { routingControllersToSpec } from 'routing-controllers-openapi';
import { appConfig } from '../config/index.js';

/**
 * tsx/esbuild does not emit design:paramtypes even when emitDecoratorMetadata is
 * enabled in tsconfig. routing-controllers-openapi assumes that metadata always
 * exists and indexes it for every decorated parameter. Supply safe Object
 * fallbacks for missing entries; explicit OpenAPI requestBody schemas remain
 * the source of truth for documented DTO bodies.
 */
function ensureParameterTypeMetadata(): void {
  const storage = getMetadataArgsStorage();
  const maxIndexesByTarget = new Map<object, Map<string, number>>();

  for (const param of storage.params) {
    if (typeof param.method !== 'string') continue;

    let methods = maxIndexesByTarget.get(param.object);
    if (!methods) {
      methods = new Map<string, number>();
      maxIndexesByTarget.set(param.object, methods);
    }

    methods.set(
      param.method,
      Math.max(methods.get(param.method) ?? -1, param.index),
    );
  }

  for (const [target, methods] of maxIndexesByTarget) {
    for (const [method, maxIndex] of methods) {
      const existing = Reflect.getMetadata(
        'design:paramtypes',
        target,
        method,
      ) as unknown[] | undefined;

      const requiredLength = maxIndex + 1;
      if (existing && existing.length >= requiredLength) continue;

      const parameterTypes = Array.from(
        { length: requiredLength },
        (_, index) => existing?.[index] ?? Object,
      );

      Reflect.defineMetadata(
        'design:paramtypes',
        parameterTypes,
        target,
        method,
      );
    }
  }
}

/** Builds the OpenAPI document from routing-controller and class-validator metadata. */
export function buildOpenApiSpec() {
  ensureParameterTypeMetadata();

  const schemas = validationMetadatasToSchemas({
    refPointerPrefix: '#/components/schemas/',
  });

  return routingControllersToSpec(
    getMetadataArgsStorage(),
    { routePrefix: appConfig.routePrefix },
    {
      info: {
        title: 'SynthCode API',
        version: appConfig.version,
        description: 'SynthCode backend API documentation.',
      },
      servers: [{ url: '/', description: 'Current API server' }],
      components: {
        schemas,
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Provide the access token returned by the login or refresh endpoint.',
          },
        },
      },
    },
  );
}

export const swaggerUiHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>SynthCode API Documentation</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>body { margin: 0; } #swagger-ui { max-width: 1440px; margin: 0 auto; }</style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = function () {
        window.ui = SwaggerUIBundle({
          url: '/api-docs.json',
          dom_id: '#swagger-ui',
          deepLinking: true,
          persistAuthorization: true,
          displayRequestDuration: true
        });
      };
    </script>
  </body>
</html>`;
