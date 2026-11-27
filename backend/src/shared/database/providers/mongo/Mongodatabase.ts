import { inject, injectable } from "inversify";
import { GLOBAL_TYPES } from "../../../../types.js";
import { IDatabase } from "../../interfaces/IDatabase.js";
import { Collection, Db, Document, MongoClient } from "mongodb";

/**
 * @class MongoDatabase
 * @implements {IDatabase<Db>}
 * @description A service class for managing MongoDB connections and operations.
 *
 * @example
 * const mongoDatabase = new MongoDatabase('mongodb://localhost:27017', 'myDatabase');
 *
 * @template Db
 */

@injectable()
export class MongoDatabase implements IDatabase<Db> {
  private client: MongoClient | null;
  public database: Db | null = null;
  private connectingPromise: Promise<Db> | null = null;

  constructor(
    @inject(GLOBAL_TYPES.dbUri)
    private readonly dbUri: string,
    @inject(GLOBAL_TYPES.dbName)
    private readonly dbName: string,
    protected readonly dbIdentifier: string = "MongoDatabase",
  ) {
    if (process.env.SKIP_DB_CONNECTION === "true") {
      this.client = null;
      this.database = null;
      console.log(
        `[${this.dbIdentifier}] Database connection skipped due to SKIP_DB_CONNECTION environment variable`,
      );
      return;
    }

    console.log(`[${this.dbIdentifier}] Initializing database connection...`);
    // TLS is decided by the URI: mongodb+srv:// (Atlas) uses it automatically, and a plain
    // mongodb://localhost URL stays unencrypted. Add ?tls=true to force it on a mongodb:// URL.
    this.client = new MongoClient(this.dbUri, {
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      retryWrites: true,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      // Report an unreachable server after 10s instead of the 30s default.
      serverSelectionTimeoutMS: 10000,
    });
  }

  /**
   * Connects to the MongoDB database.
   * @returns {Promise<Db>} The connected database instance.
   */

  private async connect(): Promise<Db> {
    if (this.database) {
        console.log(`[${this.dbIdentifier}] Already connected to database: ${this.dbName}`);
      return this.database;
    }

    if (!this.connectingPromise) {
      this.connectingPromise = (async () => {
        try {
          console.log(`[${this.dbIdentifier}] Connecting to database: ${this.dbName}`);
          await this.client?.connect();
          this.database = this.client?.db(this.dbName) ?? null;
          console.log(`[${this.dbIdentifier}] Connected to database: ${this.dbName}`);
          return this.database!;
        } catch (err) {
          this.connectingPromise = null;
          throw err;
        }
      })();
    }

    return this.connectingPromise;
  }
  //   private async connect(): Promise<Db> {
  //     console.log(`[${this.dbIdentifier}] Connecting to database: ${this.dbName}`);
  //     await this.client?.connect();
  //     this.database = this.client?.db(this.dbName) || null;
  //     console.log(`[${this.dbIdentifier}] Connected to database: ${this.dbName}`);
  //     return this.database;
  // }

  /**
   * Disconnects from the MongoDB database.
   * @returns {Promise<Db | null>} The disconnected database instance, or null if already disconnected.
   */
  public async disconnect(): Promise<Db | null> {
    if (this.client) {
      await this.client.close();
      this.database = null;
    }
    return this.database;
  }

  public async init(): Promise<Db> {
    if (!this.database) {
      await this.connect();
    }
    return this.database ?? (await this.connect());
  }

  /**
   * Pings the server. Throws if there is no connection or the server does not answer in 2s.
   * Used by the health endpoint, so it never opens a connection itself.
   */
  public async ping(): Promise<void> {
    if (!this.database) {
      throw new Error("Database is not connected");
    }
    await this.database.command({ ping: 1 }, { timeoutMS: 2000 });
  }

  /**
   * Checks if the database is connected.
   * @returns {boolean} True if the database is connected, false otherwise.
   */
  public isConnected(): boolean {
    return this.database !== null;
  }

  /**
   * Retrieves the client.
   * @returns {Promise<MongoClient>} The connected database instance.
   */
  public async getClient(): Promise<MongoClient> {
    if(!this.client) {
      throw new Error('MongoClient is not initialized');
    }
    return this.client;
  }

  /**
   * Retrieves a collection from the connected database.
   * @template T
   * @param {string} name - The name of the collection to retrieve.
   * @returns {Promise<Collection<T>>} The MongoDB collection.
   * @throws Will throw an error if the database is not connected.
   */
  public async getCollection<T extends Document>(
    name: string,
  ): Promise<Collection<T>> {
    if (!this.database) {
      await this.connect();
    }
    // if (!this.database) {
    //   throw new Error('Database is not connected');
    // }
    const database = this.database;
    if (!database) {
      throw new Error("Database is not connected");
    }
    return database.collection<T>(name);
  }
}
