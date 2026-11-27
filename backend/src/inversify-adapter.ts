import type { Container } from 'inversify';
import type { IocAdapter } from 'routing-controllers';

/** Lets routing-controllers resolve controllers and middleware from an Inversify container. */
export class InversifyAdapter implements IocAdapter {
  constructor(private readonly container: Container) {}

  get<T>(someClass: new (...args: any[]) => T): T {
    return this.container.get<T>(someClass);
  }
}
