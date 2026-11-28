import type { ObjectId, OptionalId } from 'mongodb';
import type { dtoUser } from '../../interfaces/dto.js';
import type { IUser } from '../../interfaces/model.js';

export type UserRecord = Omit<IUser, '_id'> & {
  _id: ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type NewUserRecord = OptionalId<UserRecord>;

export class RepositoryConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RepositoryConflictError';
  }
}

export interface IUserRepository {
  createUser(user: dtoUser): Promise<{ id: string; message: string }>;
  createAuthUser(user: NewUserRecord): Promise<UserRecord>;
  findByEmail(email: string): Promise<UserRecord | null>;
  findByEmailOrUsername(email: string, username: string): Promise<UserRecord | null>;
  findById(id: ObjectId): Promise<UserRecord | null>;
  markVerified(id: ObjectId, updatedAt: Date): Promise<boolean>;
  updatePassword(id: ObjectId, password: string, updatedAt: Date): Promise<boolean>;
  updateUsername(id: ObjectId, username: string, updatedAt: Date): Promise<boolean>;
}
