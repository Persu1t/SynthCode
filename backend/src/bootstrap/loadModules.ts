import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Container, ContainerModule } from 'inversify';
import { useContainer } from 'routing-controllers';
import { InversifyAdapter } from '../inversify-adapter.js';
import { sharedContainerModule } from '../container.js';

let container: Container | null = null;

export interface LoadedModules {
  controllers: Function[];
  validators: Function[];
}

/**
 * Discovers every folder in src/modules and loads the exports the loader
 * expects from its index.ts:
 *   <name>ModuleControllers, <name>ModuleValidators, <name>ContainerModules
 * Pass "all" to load everything, or a single module name to load just that one.
 */
export async function loadAppModules(moduleName: string): Promise<LoadedModules> {
  const modulesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../modules');
  const isAll = moduleName === 'all';

  const entries = await fs.readdir(modulesDir, { withFileTypes: true });
  const names = entries.filter(entry => entry.isDirectory()).map(entry => entry.name);

  let controllers: Function[] = [];
  let validators: Function[] = [];
  const containerModules: ContainerModule[] = [sharedContainerModule];

  for (const name of names) {
    if (!isAll && name !== moduleName) continue;

    // @vite-ignore keeps Vitest from rewriting this runtime path; Node and tsx resolve it directly.
    const moduleExports = await import(/* @vite-ignore */ `../modules/${name}/index.js`);
    controllers.push(...(moduleExports[`${name}ModuleControllers`] ?? []));
    validators.push(...(moduleExports[`${name}ModuleValidators`] ?? []));
    containerModules.push(...(moduleExports[`${name}ContainerModules`] ?? []));
  }

  if (controllers.length === 0) {
    throw new Error(`No controllers found for module "${moduleName}" in ${modulesDir}`);
  }

  container = new Container();
  await container.load(...new Set(containerModules));
  useContainer(new InversifyAdapter(container));

  return { controllers, validators };
}

export function getContainer(): Container {
  if (!container) {
    throw new Error('Container not initialised. Call loadAppModules() first.');
  }
  return container;
}
