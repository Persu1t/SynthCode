import { inject, injectable } from 'inversify';
import { type Collection, ObjectId } from 'mongodb';
import { GLOBAL_TYPES } from '../../../../../types.js';
import { UserRole } from '../../../../interfaces/model.js';
import { MongoDatabase } from '../index.js';
import { RepositoryConflictError, type IUserRepository, type NewUserRecord, type UserRecord } from '../../../interfaces/IUserRepository.js';
import type { dtoUser } from '../../../../interfaces/dto.js';

@injectable()
export class UserRepository implements IUserRepository {
  private users!: Collection<UserRecord>;
  private initialized?: Promise<void>;

  constructor(@inject(GLOBAL_TYPES.Database) private readonly database: MongoDatabase) {}

  private async init(): Promise<void> {
    if (!this.initialized) {
      this.initialized = (async () => {
        this.users = await this.database.getCollection<UserRecord>('users');
        await Promise.all([
          this.users.createIndex({ email: 1 }, { unique: true }),
          this.users.createIndex({ username: 1 }, { unique: true }),
        ]);
      })();
    }
    await this.initialized;
  }

  private throwConflict(error: unknown): never {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
      throw new RepositoryConflictError('Email or username is already registered');
    }
    throw error;
  }

  async createUser(user: dtoUser): Promise<{ id: string; message: string }> {
    const now = new Date();
    const created = await this.createAuthUser({
      ...user,
      verified: false,
      role: UserRole.USER,
      isBlocked: false,
      createdAt: now,
      updatedAt: now,
    });
    return { id: created._id.toString(), message: 'User created successfully' };
  }

  async createAuthUser(user: NewUserRecord): Promise<UserRecord> {
    await this.init();
    try {
      const result = await this.users.insertOne(user);
      const created = await this.users.findOne({ _id: result.insertedId });
      if (!created) throw new Error('User was inserted but could not be read back');
      return created;
    } catch (error) {
      this.throwConflict(error);
    }
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    await this.init();
    return this.users.findOne({ email });
  }

  async findByEmailOrUsername(email: string, username: string): Promise<UserRecord | null> {
    await this.init();
    return this.users.findOne({ $or: [{ email }, { username }] });
  }

  async findById(id: ObjectId): Promise<UserRecord | null> {
    await this.init();
    return this.users.findOne({ _id: id });
  }

  async markVerified(id: ObjectId, updatedAt: Date): Promise<boolean> {
    await this.init();
    const result = await this.users.updateOne(
      { _id: id, verified: false },
      { $set: { verified: true, updatedAt } },
    );
    return result.modifiedCount === 1;
  }

  async updatePassword(id: ObjectId, password: string, updatedAt: Date): Promise<boolean> {
    await this.init();
    const result = await this.users.updateOne({ _id: id }, { $set: { password, updatedAt } });
    return result.matchedCount === 1;
  }

  async updateUsername(id: ObjectId, username: string, updatedAt: Date): Promise<boolean> {
    await this.init();
    try {
      const result = await this.users.updateOne({ _id: id }, { $set: { username, updatedAt } });
      return result.matchedCount === 1;
    } catch (error) {
      this.throwConflict(error);
    }
  }
}
