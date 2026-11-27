import { ContainerModule } from "inversify";
import { appConfig } from "./config/index.js";
import { GLOBAL_TYPES } from "./types.js";
import { HttpErrorHandler, MongoDatabase } from "./shared/index.js";
import { dbConfig } from "./config/db.js";
/** Bindings that every module can rely on. */
export const sharedContainerModule = new ContainerModule((options) => {
  const dbUri = dbConfig.dbUri;
  const dbName = dbConfig.dbName;

  options.bind(GLOBAL_TYPES.dbUri).toConstantValue(dbUri);
  options.bind(GLOBAL_TYPES.dbName).toConstantValue(dbName);

  options.bind(GLOBAL_TYPES.AppConfig).toConstantValue(appConfig);
  options.bind(HttpErrorHandler).toSelf().inSingletonScope();
  options.bind(GLOBAL_TYPES.Database).to(MongoDatabase).inSingletonScope();
});
