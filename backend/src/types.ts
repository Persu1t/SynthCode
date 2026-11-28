/** Dependency-injection tokens shared by every module. */
export const GLOBAL_TYPES = {
  Database: Symbol.for('Database'),
  AppConfig: Symbol.for('AppConfig'),
  dbUri: Symbol.for('dbUri'),
  dbName: Symbol.for('dbName'),
  UserRepository: Symbol.for('UserRepository'),
  AuthRepository: Symbol.for('AuthRepository'),
};
