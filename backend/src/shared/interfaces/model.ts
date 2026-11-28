import { ObjectId } from "mongodb";

export type AuthTokenPurpose = 'email_verification' | 'password_reset';

export enum UserRole {
  ADMIN = "admin",
  USER = "user",
}

export interface IUser {
  _id?: ObjectId | null;
  email: string;
  password: string;
  username: string;
  verified: boolean;
  role: UserRole;
  isBlocked: boolean;
}

export interface AuthSessionRecord {
  _id?: ObjectId;
  userId: ObjectId | null;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt?: Date;
}

export interface AuthTokenRecord {
  _id?: ObjectId;
  userId: ObjectId | null;
  tokenHash: string;
  purpose: AuthTokenPurpose;
  expiresAt: Date;
  createdAt: Date;
  usedAt?: Date;
}
