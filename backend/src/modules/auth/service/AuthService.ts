import { inject, injectable } from 'inversify';
import { MongoDatabase } from '../../../shared/database/providers/mongo/index.js';
import { GLOBAL_TYPES } from '../../../types.js';
import { ObjectId, type Collection } from 'mongodb';
import { BadRequestError, ForbiddenError, HttpError, NotFoundError, UnauthorizedError } from 'routing-controllers';
import type { IAuthService, AuthTokenResponse } from '../interfaces/IAuthService.js';
import type { RegisterDto, LoginDto } from '../classes/validators/AuthValidators.js';
import {
  ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS, VERIFICATION_TOKEN_TTL_MS,
  PASSWORD_RESET_TOKEN_TTL_MS, createOpaqueToken, hashPassword, verifyPassword,
  hashToken, signToken,
} from '../utils/crypto.js';
import { UserRole } from '../../../shared/interfaces/model.js';

interface AuthUser {
  _id: ObjectId;
  email: string;
  username: string;
  password: string;
  verified: boolean;
  role: UserRole;
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}
interface AuthTokenRecord {
  _id?: ObjectId;
  userId: ObjectId;
  tokenHash: string;
  purpose: 'email_verification' | 'password_reset';
  expiresAt: Date;
  createdAt: Date;
  usedAt?: Date;
}
interface AuthSession {
  _id?: ObjectId;
  userId: ObjectId;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt?: Date;
}
interface EmailOutboxRecord {
  to: string;
  template: 'verify_email' | 'reset_password';
  data: Record<string, string>;
  createdAt: Date;
  status: 'pending';
}

@injectable()
export class AuthService implements IAuthService {
  private users!: Collection<AuthUser>;
  private tokens!: Collection<AuthTokenRecord>;
  private sessions!: Collection<AuthSession>;
  private outbox!: Collection<EmailOutboxRecord>;
  private initialized?: Promise<void>;

  constructor(@inject(GLOBAL_TYPES.Database) private readonly database: MongoDatabase) {}

  private async init(): Promise<void> {
    if (!this.initialized) {
      this.initialized = (async () => {
        this.users = await this.database.getCollection<AuthUser>('users');
        this.tokens = await this.database.getCollection<AuthTokenRecord>('auth_tokens');
        this.sessions = await this.database.getCollection<AuthSession>('auth_sessions');
        this.outbox = await this.database.getCollection<EmailOutboxRecord>('email_outbox');
        await Promise.all([
          this.users.createIndex({ email: 1 }, { unique: true }),
          this.users.createIndex({ username: 1 }, { unique: true }),
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

  private publicUser(user: AuthUser): AuthTokenResponse['user'] {
    return { id: user._id.toString(), email: user.email, username: user.username, role: user.role, verified: user.verified };
  }

  private async enqueueEmail(to: string, template: EmailOutboxRecord['template'], data: Record<string, string>): Promise<void> {
    await this.outbox.insertOne({ to, template, data, createdAt: new Date(), status: 'pending' });
  }

  async register(input: RegisterDto): Promise<{ message: string }> {
    await this.init();
    const email = input.email.trim().toLowerCase();
    const username = input.username.trim();
    const exists = await this.users.findOne({ $or: [{ email }, { username }] });
    if (exists) throw new HttpError(409, 'Email or username is already registered');

    const now = new Date();
    const result = await this.users.insertOne({
      email, username, password: await hashPassword(input.password),
      verified: false, role: UserRole.USER, isBlocked: false, createdAt: now, updatedAt: now,
    } as AuthUser);
    const rawToken = createOpaqueToken();
    await this.tokens.insertOne({
      userId: result.insertedId, tokenHash: hashToken(rawToken), purpose: 'email_verification',
      expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS), createdAt: now,
    });
    await this.enqueueEmail(email, 'verify_email', { token: rawToken, username });
    return { message: 'Account created. Check your email for the verification link.' };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    await this.init();
    const record = await this.tokens.findOne({
      tokenHash: hashToken(token), purpose: 'email_verification', expiresAt: { $gt: new Date() }, usedAt: { $exists: false },
    });
    if (!record) throw new UnauthorizedError('Verification token is invalid or expired');
    const result = await this.users.updateOne({ _id: record.userId, verified: false }, { $set: { verified: true, updatedAt: new Date() } });
    if (result.modifiedCount !== 1) throw new BadRequestError('Account is already verified or unavailable');
    await this.tokens.updateOne({ _id: record._id }, { $set: { usedAt: new Date() } });
    await this.tokens.deleteMany({ userId: record.userId, purpose: 'email_verification', _id: { $ne: record._id } });
    return { message: 'Email verified successfully. You can now log in.' };
  }

  async resendVerification(emailInput: string): Promise<{ message: string }> {
    await this.init();
    const user = await this.users.findOne({ email: emailInput.trim().toLowerCase() });
    const generic = 'If the account exists and needs verification, a new verification email will be sent.';
    if (!user || user.verified) return { message: generic };
    await this.tokens.deleteMany({ userId: user._id, purpose: 'email_verification' });
    const token = createOpaqueToken();
    await this.tokens.insertOne({
      userId: user._id, tokenHash: hashToken(token), purpose: 'email_verification',
      expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS), createdAt: new Date(),
    });
    await this.enqueueEmail(user.email, 'verify_email', { token, username: user.username });
    return { message: generic };
  }

  async login(input: LoginDto): Promise<AuthTokenResponse> {
    await this.init();
    const user = await this.users.findOne({ email: input.email.trim().toLowerCase() });
    if (!user || !(await verifyPassword(input.password, user.password))) throw new UnauthorizedError('Invalid email or password');
    if (!user.verified) throw new ForbiddenError('Please verify your email before logging in');
    if (user.isBlocked) throw new ForbiddenError('This account has been blocked');

    const refreshToken = createOpaqueToken();
    await this.sessions.insertOne({
      userId: user._id, tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000), createdAt: new Date(),
    });
    return this.issueTokens(user, refreshToken);
  }

  private issueTokens(user: AuthUser, refreshToken: string): AuthTokenResponse {
    const accessToken = signToken({
      sub: user._id.toString(), email: user.email, role: user.role, type: 'access',
    }, ACCESS_TOKEN_TTL_SECONDS);
    return {
      accessToken, refreshToken, tokenType: 'Bearer', expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      user: this.publicUser(user),
    };
  }

  async refresh(rawRefreshToken: string): Promise<AuthTokenResponse> {
    await this.init();
    const oldHash = hashToken(rawRefreshToken);
    const session = await this.sessions.findOne({
      tokenHash: oldHash, expiresAt: { $gt: new Date() }, revokedAt: { $exists: false },
    });
    if (!session) throw new UnauthorizedError('Refresh token is invalid or expired');
    const user = await this.users.findOne({ _id: session.userId });
    if (!user || !user.verified || user.isBlocked) throw new UnauthorizedError('Account is unavailable');

    const newRefreshToken = createOpaqueToken();
    const updated = await this.sessions.updateOne(
      { _id: session._id, tokenHash: oldHash, revokedAt: { $exists: false } },
      { $set: { tokenHash: hashToken(newRefreshToken), expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000) } },
    );
    if (updated.modifiedCount !== 1) throw new UnauthorizedError('Refresh token has already been used');
    return this.issueTokens(user, newRefreshToken);
  }

  async logout(rawRefreshToken: string): Promise<{ message: string }> {
    await this.init();
    await this.sessions.updateOne(
      { tokenHash: hashToken(rawRefreshToken), revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } },
    );
    return { message: 'Logged out successfully' };
  }

  async forgotPassword(emailInput: string): Promise<{ message: string }> {
    await this.init();
    const user = await this.users.findOne({ email: emailInput.trim().toLowerCase() });
    const generic = 'If the account exists, password reset instructions will be sent.';
    if (!user || !user.verified || user.isBlocked) return { message: generic };
    await this.tokens.deleteMany({ userId: user._id, purpose: 'password_reset' });
    const token = createOpaqueToken();
    await this.tokens.insertOne({
      userId: user._id, tokenHash: hashToken(token), purpose: 'password_reset',
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS), createdAt: new Date(),
    });
    await this.enqueueEmail(user.email, 'reset_password', { token, username: user.username });
    return { message: generic };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    await this.init();
    const record = await this.tokens.findOne({
      tokenHash: hashToken(token), purpose: 'password_reset',
      expiresAt: { $gt: new Date() }, usedAt: { $exists: false },
    });
    if (!record) throw new UnauthorizedError('Password reset token is invalid or expired');
    const password = await hashPassword(newPassword);
    await this.users.updateOne({ _id: record.userId }, { $set: { password, updatedAt: new Date() } });
    await this.tokens.updateOne({ _id: record._id }, { $set: { usedAt: new Date() } });
    await this.sessions.updateMany({ userId: record.userId, revokedAt: { $exists: false } }, { $set: { revokedAt: new Date() } });
    return { message: 'Password updated. Please log in again.' };
  }

  async getProfile(userId: string): Promise<Record<string, unknown>> {
    await this.init();
    if (!ObjectId.isValid(userId)) throw new UnauthorizedError('Invalid user');
    const user = await this.users.findOne({ _id: new ObjectId(userId) });
    if (!user) throw new NotFoundError('User not found');
    const { password: _password, _id, ...safe } = user;
    return { ...safe, id: _id.toString() };
  }

  async updateProfile(userId: string, usernameInput: string): Promise<{ message: string }> {
    await this.init();
    if (!ObjectId.isValid(userId)) throw new UnauthorizedError('Invalid user');
    try {
      const result = await this.users.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { username: usernameInput.trim(), updatedAt: new Date() } },
      );
      if (!result.matchedCount) throw new NotFoundError('User not found');
      return { message: 'Profile updated successfully' };
    } catch (error: any) {
      if (error?.code === 11000) throw new HttpError(409, 'Username is already taken');
      throw error;
    }
  }
}
