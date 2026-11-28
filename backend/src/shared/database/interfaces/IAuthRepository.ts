import type { ObjectId } from 'mongodb';
import { AuthSessionRecord, AuthTokenPurpose, AuthTokenRecord } from '../../interfaces/model.js';





// export type NewAuthTokenRecord = Omit<AuthTokenRecord, '_id' | 'usedAt'>;



// export type NewAuthSessionRecord = Omit<AuthSessionRecord, '_id' | 'revokedAt'>;

export interface EmailOutboxRecord {
  to: string;
  template: 'verify_email' | 'reset_password';
  data: Record<string, string>;
  createdAt: Date;
  status: 'pending';
}

export interface IAuthRepository {
  createToken(record: AuthTokenRecord): Promise<void>;
  findActiveToken(tokenHash: string, purpose: AuthTokenPurpose, now: Date): Promise<AuthTokenRecord | null>;
  consumeToken(id: ObjectId, now: Date): Promise<boolean>;
  deleteTokens(userId: ObjectId, purpose: AuthTokenPurpose, exceptId?: ObjectId): Promise<void>;
  createSession(record: AuthSessionRecord): Promise<void>;
  findActiveSession(tokenHash: string, now: Date): Promise<AuthSessionRecord | null>;
  rotateSession(id: ObjectId, oldHash: string, newHash: string, expiresAt: Date): Promise<boolean>;
  revokeSession(tokenHash: string, revokedAt: Date): Promise<void>;
  revokeSessionsForUser(userId: ObjectId, revokedAt: Date): Promise<void>;
  enqueueEmail(record: EmailOutboxRecord): Promise<void>;
}
