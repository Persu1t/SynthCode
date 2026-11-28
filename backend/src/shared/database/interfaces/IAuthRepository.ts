import type { ObjectId } from 'mongodb';

export type AuthTokenPurpose = 'email_verification' | 'password_reset';

export interface AuthTokenRecord {
  _id: ObjectId;
  userId: ObjectId;
  tokenHash: string;
  purpose: AuthTokenPurpose;
  expiresAt: Date;
  createdAt: Date;
  usedAt?: Date;
}

export type NewAuthTokenRecord = Omit<AuthTokenRecord, '_id' | 'usedAt'>;

export interface AuthSessionRecord {
  _id: ObjectId;
  userId: ObjectId;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt?: Date;
}

export type NewAuthSessionRecord = Omit<AuthSessionRecord, '_id' | 'revokedAt'>;

export interface EmailOutboxRecord {
  to: string;
  template: 'verify_email' | 'reset_password';
  data: Record<string, string>;
  createdAt: Date;
  status: 'pending';
}

export interface IAuthRepository {
  createToken(record: NewAuthTokenRecord): Promise<void>;
  findActiveToken(tokenHash: string, purpose: AuthTokenPurpose, now: Date): Promise<AuthTokenRecord | null>;
  consumeToken(id: ObjectId, now: Date): Promise<boolean>;
  deleteTokens(userId: ObjectId, purpose: AuthTokenPurpose, exceptId?: ObjectId): Promise<void>;
  createSession(record: NewAuthSessionRecord): Promise<void>;
  findActiveSession(tokenHash: string, now: Date): Promise<AuthSessionRecord | null>;
  rotateSession(id: ObjectId, oldHash: string, newHash: string, expiresAt: Date): Promise<boolean>;
  revokeSession(tokenHash: string, revokedAt: Date): Promise<void>;
  revokeSessionsForUser(userId: ObjectId, revokedAt: Date): Promise<void>;
  enqueueEmail(record: EmailOutboxRecord): Promise<void>;
}
