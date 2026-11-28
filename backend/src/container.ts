import { ContainerModule } from 'inversify';
import { appConfig } from './config/index.js';
import { dbConfig } from './config/db.js';
import { GLOBAL_TYPES } from './types.js';
import { HttpErrorHandler, MongoDatabase } from './shared/index.js';
import { UserRepository } from './shared/database/providers/mongo/repositories/UserRepository.js';
import { AuthRepository } from './shared/database/providers/mongo/repositories/AuthRepository.js';

/** Bindings that every module can rely on. */
export const sharedContainerModule = new ContainerModule(options => {
  options.bind(GLOBAL_TYPES.dbUri).toConstantValue(dbConfig.dbUri);
  options.bind(GLOBAL_TYPES.dbName).toConstantValue(dbConfig.dbName);
  options.bind(GLOBAL_TYPES.AppConfig).toConstantValue(appConfig);
  options.bind(HttpErrorHandler).toSelf().inSingletonScope();
  options.bind(GLOBAL_TYPES.Database).to(MongoDatabase).inSingletonScope();
  options.bind(GLOBAL_TYPES.UserRepository).to(UserRepository).inSingletonScope();
  options.bind(GLOBAL_TYPES.AuthRepository).to(AuthRepository).inSingletonScope();
});
