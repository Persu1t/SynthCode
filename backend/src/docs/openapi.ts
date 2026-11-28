import { getMetadataArgsStorage } from 'routing-controllers';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';
import { routingControllersToSpec } from 'routing-controllers-openapi';
import { appConfig } from '../config/index.js';

/** Builds the OpenAPI document from routing-controller and class-validator metadata. */
export function buildOpenApiSpec() {
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
      servers: [{ url: appConfig.routePrefix, description: 'Current API server' }],
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
