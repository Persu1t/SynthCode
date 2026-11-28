import { inject, injectable } from 'inversify';
import { Body, Get, JsonController, Patch, Post, Req, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { AUTH_TYPES } from '../types.js';
import type { IAuthService } from '../interfaces/IAuthService.js';
import { AuthMiddleware, type AuthenticatedRequest } from '../middleware/AuthMiddleware.js';
import {
  RegisterDto,
  VerifyEmailDto,
  LoginDto,
  RefreshTokenDto,
  LogoutDto,
  ResendVerificationDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  UpdateProfileDto,
  MessageResponseDto,
  AuthTokenResponseDto,
  AuthErrorResponseDto,
  UserProfileResponseDto,
} from '../classes/validators/AuthValidators.js';

@OpenAPI({
  tags: ['Authentication'],
  description: 'Authentication, account verification, session, and profile operations',
})
@JsonController('/auth')
@injectable()
export class AuthController {
  constructor(
    @inject(AUTH_TYPES.AuthService)
    private readonly authService: IAuthService,
  ) {}

  @Post('/register')
  @OpenAPI({
    summary: 'Register a new user account',
    description: 'Creates an unverified account and queues an email verification message.',
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterDto' } } },
    },
  })
  @ResponseSchema(MessageResponseDto, { statusCode: 200, description: 'Account created; verification instructions queued' })
  @ResponseSchema(AuthErrorResponseDto, { statusCode: 400, description: 'Invalid registration details' })
  @ResponseSchema(AuthErrorResponseDto, { statusCode: 409, description: 'Email or username already registered' })
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('/verify-email')
  @OpenAPI({
    summary: 'Verify an email address',
    description: 'Consumes a one-time email verification token and activates the account.',
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/VerifyEmailDto' } } },
    },
  })
  @ResponseSchema(MessageResponseDto, { statusCode: 200, description: 'Email verified' })
  @ResponseSchema(AuthErrorResponseDto, { statusCode: 400, description: 'Account already verified or unavailable' })
  @ResponseSchema(AuthErrorResponseDto, { statusCode: 401, description: 'Verification token invalid, expired, or already used' })
  verifyEmail(@Body() body: VerifyEmailDto) {
    return this.authService.verifyEmail(body.token);
  }

  @Post('/resend-verification')
  @OpenAPI({
    summary: 'Resend email verification',
    description: 'Queues a new verification message when the account exists and is not yet verified. The response does not reveal account existence.',
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ResendVerificationDto' } } },
    },
  })
  @ResponseSchema(MessageResponseDto, { statusCode: 200, description: 'Generic response to prevent account enumeration' })
  resendVerification(@Body() body: ResendVerificationDto) {
    return this.authService.resendVerification(body.email);
  }

  @Post('/login')
  @OpenAPI({
    summary: 'Log in',
    description: 'Authenticates a verified, unblocked user and creates a refresh-token session.',
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginDto' } } },
    },
  })
  @ResponseSchema(AuthTokenResponseDto, { statusCode: 200, description: 'Access and refresh tokens with user information' })
  @ResponseSchema(AuthErrorResponseDto, { statusCode: 401, description: 'Invalid email or password' })
  @ResponseSchema(AuthErrorResponseDto, { statusCode: 403, description: 'Email is not verified or account is blocked' })
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post('/refresh')
  @OpenAPI({
    summary: 'Refresh an access token',
    description: 'Rotates the refresh token and returns a new access token.',
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/RefreshTokenDto' } } },
    },
  })
  @ResponseSchema(AuthTokenResponseDto, { statusCode: 200, description: 'New access and refresh tokens' })
  @ResponseSchema(AuthErrorResponseDto, { statusCode: 401, description: 'Refresh token invalid, expired, revoked, or already used' })
  refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('/logout')
  @OpenAPI({
    summary: 'Log out',
    description: 'Revokes the refresh-token session. Repeated calls are safe.',
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/LogoutDto' } } },
    },
  })
  @ResponseSchema(MessageResponseDto, { statusCode: 200, description: 'Logout completed' })
  logout(@Body() body: LogoutDto) {
    return this.authService.logout(body.refreshToken);
  }

  @Post('/forgot-password')
  @OpenAPI({
    summary: 'Request a password reset',
    description: 'Queues a password-reset message for an eligible account. The response does not reveal account existence.',
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ForgotPasswordDto' } } },
    },
  })
  @ResponseSchema(MessageResponseDto, { statusCode: 200, description: 'Generic response to prevent account enumeration' })
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('/reset-password')
  @OpenAPI({
    summary: 'Reset a password',
    description: 'Consumes a one-time password-reset token, updates the password, and revokes existing sessions.',
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/ResetPasswordDto' } } },
    },
  })
  @ResponseSchema(MessageResponseDto, { statusCode: 200, description: 'Password updated' })
  @ResponseSchema(AuthErrorResponseDto, { statusCode: 401, description: 'Reset token invalid, expired, or already used' })
  @ResponseSchema(AuthErrorResponseDto, { statusCode: 404, description: 'User no longer exists' })
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }

  @Get('/me')
  @UseBefore(AuthMiddleware)
  @OpenAPI({
    summary: 'Get the current user profile',
    description: 'Returns the profile associated with the bearer access token.',
    security: [{ bearerAuth: [] }],
  })
  @ResponseSchema(UserProfileResponseDto, { statusCode: 200, description: 'Current user profile' })
  @ResponseSchema(AuthErrorResponseDto, { statusCode: 401, description: 'Missing or invalid access token' })
  @ResponseSchema(AuthErrorResponseDto, { statusCode: 404, description: 'User not found' })
  me(@Req() request: AuthenticatedRequest) {
    return this.authService.getProfile(request.authUser!.id);
  }

  @Patch('/me')
  @UseBefore(AuthMiddleware)
  @OpenAPI({
    summary: 'Update the current user profile',
    description: 'Updates the username for the authenticated user.',
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateProfileDto' } } },
    },
  })
  @ResponseSchema(MessageResponseDto, { statusCode: 200, description: 'Profile updated' })
  @ResponseSchema(AuthErrorResponseDto, { statusCode: 401, description: 'Missing or invalid access token' })
  @ResponseSchema(AuthErrorResponseDto, { statusCode: 404, description: 'User not found' })
  @ResponseSchema(AuthErrorResponseDto, { statusCode: 409, description: 'Username already taken' })
  updateMe(@Body() body: UpdateProfileDto, @Req() request: AuthenticatedRequest) {
    return this.authService.updateProfile(request.authUser!.id, body.username);
  }
}
