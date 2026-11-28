import { inject, injectable } from 'inversify';
import { type Collection, ObjectId } from 'mongodb';
import { GLOBAL_TYPES } from '../../../../../types.js';
import { MongoDatabase } from '../index.js';
import type {
  AuthSessionRecord,
  AuthTokenRecord,
  EmailOutboxRecord,
  IAuthRepository,
  NewAuthSessionRecord,
  NewAuthTokenRecord,
} from '../../../interfaces/IAuthRepository.js';
import type { AuthTokenPurpose } from '../../../../interfaces/model.js';

@injectable()
export class AuthRepository implements IAuthRepository {
  private tokens!: Collection<AuthTokenRecord>;
  private sessions!: Collection<AuthSessionRecord>;
  private outbox!: Collection<EmailOutboxRecord>;
  private initialized?: Promise<void>;

  constructor(@inject(GLOBAL_TYPES.Database) private readonly database: MongoDatabase) {}

  private async init(): Promise<void> {
    if (!this.initialized) {
      this.initialized = (async () => {
        this.tokens = await this.database.getCollection<AuthTokenRecord>('auth_tokens');
        this.sessions = await this.database.getCollection<AuthSessionRecord>('auth_sessions');
        this.outbox = await this.database.getCollection<EmailOutboxRecord>('email_outbox');
        await Promise.all([
          this.tokens.createIndex({ tokenHash: 1, purpose: 1 }, { unique: true }),
          this.tokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
          this.sessions.createIndex({ tokenHash: 1 }, { unique: true }),
          this.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
          this.outbox.createIndex({ status: 1, createdAt: 1 }),
        ]);
      })();
    }
    await this.initialized;
  }

  async createToken(record: NewAuthTokenRecord): Promise<void> {
    await this.init();
    await this.tokens.insertOne(record);
  }

  async findActiveToken(tokenHash: string, purpose: AuthTokenPurpose, now: Date): Promise<AuthTokenRecord | null> {
    await this.init();
    return this.tokens.findOne({ tokenHash, purpose, expiresAt: { $gt: now }, usedAt: { $exists: false } });
  }

  async consumeToken(id: ObjectId, now: Date): Promise<boolean> {
    await this.init();
    const result = await this.tokens.updateOne(
      { _id: id, usedAt: { $exists: false }, expiresAt: { $gt: now } },
      { $set: { usedAt: now } },
    );
    return result.modifiedCount === 1;
  }

  async deleteTokens(userId: ObjectId, purpose: AuthTokenPurpose, exceptId?: ObjectId): Promise<void> {
    await this.init();
    const filter: { userId: ObjectId; purpose: AuthTokenPurpose; _id?: { $ne: ObjectId } } = { userId, purpose };
    if (exceptId) filter._id = { $ne: exceptId };
    await this.tokens.deleteMany(filter);
  }

  async createSession(record: NewAuthSessionRecord): Promise<void> {
    await this.init();
    await this.sessions.insertOne(record);
  }

  async findActiveSession(tokenHash: string, now: Date): Promise<AuthSessionRecord | null> {
    await this.init();
    return this.sessions.findOne({ tokenHash, expiresAt: { $gt: now }, revokedAt: { $exists: false } });
  }

  async rotateSession(id: ObjectId, oldHash: string, newHash: string, expiresAt: Date): Promise<boolean> {
    await this.init();
    const result = await this.sessions.updateOne(
      { _id: id, tokenHash: oldHash, revokedAt: { $exists: false }, expiresAt: { $gt: new Date() } },
      { $set: { tokenHash: newHash, expiresAt } },
    );
    return result.modifiedCount === 1;
  }

  async revokeSession(tokenHash: string, revokedAt: Date): Promise<void> {
    await this.init();
    await this.sessions.updateOne({ tokenHash, revokedAt: { $exists: false } }, { $set: { revokedAt } });
  }

  async revokeSessionsForUser(userId: ObjectId, revokedAt: Date): Promise<void> {
    await this.init();
    await this.sessions.updateMany({ userId, revokedAt: { $exists: false } }, { $set: { revokedAt } });
  }

  async enqueueEmail(record: EmailOutboxRecord): Promise<void> {
    await this.init();
    await this.outbox.insertOne(record);
  }
}
