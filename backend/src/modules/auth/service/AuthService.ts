import { inject, injectable } from 'inversify';
import { ObjectId } from 'mongodb';
import {
  BadRequestError,
  ForbiddenError,
  HttpError,
  NotFoundError,
  UnauthorizedError,
} from 'routing-controllers';
import { GLOBAL_TYPES } from '../../../types.js';
import type { IUserRepository, UserRecord } from '../../../shared/database/interfaces/IUserRepository.js';
import type { IAuthRepository } from '../../../shared/database/interfaces/IAuthRepository.js';
import type { IAuthService, AuthTokenResponse } from '../interfaces/IAuthService.js';
import type { RegisterDto, LoginDto } from '../classes/validators/AuthValidators.js';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
  VERIFICATION_TOKEN_TTL_MS,
  PASSWORD_RESET_TOKEN_TTL_MS,
  createOpaqueToken,
  hashPassword,
  verifyPassword,
  hashToken,
  signToken,
} from '../utils/crypto.js';
import { UserRole } from '../../../shared/interfaces/model.js';

@injectable()
export class AuthService implements IAuthService {
  constructor(
    @inject(GLOBAL_TYPES.UserRepository)
    private readonly userRepository: IUserRepository,
    @inject(GLOBAL_TYPES.AuthRepository)
    private readonly authRepository: IAuthRepository,
  ) {}

  private publicUser(user: UserRecord): AuthTokenResponse['user'] {
    return {
      id: user._id ? user._id.toString() : null,
      email: user.email,
      username: user.username,
      role: user.role,
      verified: user.verified,
    };
  }

  private async enqueueEmail(
    to: string,
    template: 'verify_email' | 'reset_password',
    data: Record<string, string>,
  ): Promise<void> {
    await this.authRepository.enqueueEmail({
      to,
      template,
      data,
      createdAt: new Date(),
      status: 'pending',
    });
  }

  async register(input: RegisterDto): Promise<{ message: string }> {
    const email = input.email.trim().toLowerCase();
    const username = input.username.trim();
    const existing = await this.userRepository.findByEmailOrUsername(email, username);
    if (existing) throw new HttpError(409, 'Email or username is already registered');

    const now = new Date();
    let user: UserRecord;
    try {
      user = await this.userRepository.createAuthUser({
        email,
        username,
        password: await hashPassword(input.password),
        verified: false,
        role: UserRole.USER,
        isBlocked: false,
        createdAt: now,
        updatedAt: now,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'RepositoryConflictError') {
        throw new HttpError(409, 'Email or username is already registered');
      }
      throw error;
    }

    const rawToken = createOpaqueToken();
    await this.authRepository.createToken({
      userId: user._id || null,
      tokenHash: hashToken(rawToken),
      purpose: 'email_verification',
      expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
      createdAt: now,
    });
    await this.enqueueEmail(email, 'verify_email', { token: rawToken, username });
    return { message: 'Account created. Check your email for the verification link.' };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const record = await this.authRepository.findActiveToken(
      hashToken(token),
      'email_verification',
      new Date(),
    );
    if (!record) throw new UnauthorizedError('Verification token is invalid or expired');

    const now = new Date();
    const consumed = await this.authRepository.consumeToken(record._id, now);
    if (!consumed) throw new UnauthorizedError('Verification token has already been used');

    const verified = await this.userRepository.markVerified(record.userId, now);
    if (!verified) throw new BadRequestError('Account is already verified or unavailable');

    await this.authRepository.deleteTokens(record.userId, 'email_verification', record._id);
    return { message: 'Email verified successfully. You can now log in.' };
  }

  async resendVerification(emailInput: string): Promise<{ message: string }> {
    const user = await this.userRepository.findByEmail(emailInput.trim().toLowerCase());
    const generic = 'If the account exists and needs verification, a new verification email will be sent.';
    if (!user || user.verified) return { message: generic };

    await this.authRepository.deleteTokens(user._id, 'email_verification');
    const token = createOpaqueToken();
    await this.authRepository.createToken({
      userId: user._id,
      tokenHash: hashToken(token),
      purpose: 'email_verification',
      expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
      createdAt: new Date(),
    });
    await this.enqueueEmail(user.email, 'verify_email', { token, username: user.username });
    return { message: generic };
  }

  async login(input: LoginDto): Promise<AuthTokenResponse> {
    const user = await this.userRepository.findByEmail(input.email.trim().toLowerCase());
    if (!user || !(await verifyPassword(input.password, user.password))) {
      throw new UnauthorizedError('Invalid email or password');
    }
    if (!user.verified) throw new ForbiddenError('Please verify your email before logging in');
    if (user.isBlocked) throw new ForbiddenError('This account has been blocked');

    const refreshToken = createOpaqueToken();
    await this.authRepository.createSession({
      userId: user._id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
      createdAt: new Date(),
    });
    return this.issueTokens(user, refreshToken);
  }

  private issueTokens(user: UserRecord, refreshToken: string): AuthTokenResponse {
    const accessToken = signToken({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      type: 'access',
    }, ACCESS_TOKEN_TTL_SECONDS);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      user: this.publicUser(user),
    };
  }

  async refresh(rawRefreshToken: string): Promise<AuthTokenResponse> {
    const oldHash = hashToken(rawRefreshToken);
    const session = await this.authRepository.findActiveSession(oldHash, new Date());
    if (!session) throw new UnauthorizedError('Refresh token is invalid or expired');

    const user = await this.userRepository.findById(session.userId);
    if (!user || !user.verified || user.isBlocked) {
      throw new UnauthorizedError('Account is unavailable');
    }

    const newRefreshToken = createOpaqueToken();
    const rotated = await this.authRepository.rotateSession(
      session._id,
      oldHash,
      hashToken(newRefreshToken),
      new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
    );
    if (!rotated) throw new UnauthorizedError('Refresh token has already been used');
    return this.issueTokens(user, newRefreshToken);
  }

  async logout(rawRefreshToken: string): Promise<{ message: string }> {
    await this.authRepository.revokeSession(hashToken(rawRefreshToken), new Date());
    return { message: 'Logged out successfully' };
  }

  async forgotPassword(emailInput: string): Promise<{ message: string }> {
    const user = await this.userRepository.findByEmail(emailInput.trim().toLowerCase());
    const generic = 'If the account exists, password reset instructions will be sent.';
    if (!user || !user.verified || user.isBlocked) return { message: generic };

    await this.authRepository.deleteTokens(user._id, 'password_reset');
    const token = createOpaqueToken();
    await this.authRepository.createToken({
      userId: user._id,
      tokenHash: hashToken(token),
      purpose: 'password_reset',
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS),
      createdAt: new Date(),
    });
    await this.enqueueEmail(user.email, 'reset_password', { token, username: user.username });
    return { message: generic };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const record = await this.authRepository.findActiveToken(
      hashToken(token),
      'password_reset',
      new Date(),
    );
    if (!record) throw new UnauthorizedError('Password reset token is invalid or expired');

    const consumed = await this.authRepository.consumeToken(record._id, new Date());
    if (!consumed) throw new UnauthorizedError('Password reset token has already been used');

    const changed = await this.userRepository.updatePassword(
      record.userId,
      await hashPassword(newPassword),
      new Date(),
    );
    if (!changed) throw new NotFoundError('User not found');

    await this.authRepository.revokeSessionsForUser(record.userId, new Date());
    return { message: 'Password updated. Please log in again.' };
  }

  async getProfile(userId: string): Promise<Record<string, unknown>> {
    if (!ObjectId.isValid(userId)) throw new UnauthorizedError('Invalid user');
    const user = await this.userRepository.findById(new ObjectId(userId));
    if (!user) throw new NotFoundError('User not found');

    const { password: _password, _id, ...safe } = user;
    return { ...safe, id: _id.toString() };
  }

  async updateProfile(userId: string, usernameInput: string): Promise<{ message: string }> {
    if (!ObjectId.isValid(userId)) throw new UnauthorizedError('Invalid user');
    try {
      const updated = await this.userRepository.updateUsername(
        new ObjectId(userId),
        usernameInput.trim(),
        new Date(),
      );
      if (!updated) throw new NotFoundError('User not found');
      return { message: 'Profile updated successfully' };
    } catch (error) {
      if (error instanceof Error && error.name === 'RepositoryConflictError') {
        throw new HttpError(409, 'Username is already taken');
      }
      throw error;
    }
  }
}
 