import { inject, injectable } from 'inversify';
import {
  Body, CurrentUser, Get, JsonController, Patch, Post, UseBefore,
} from 'routing-controllers';
import { AUTH_TYPES } from '../types.js';
import { AuthService } from '../service/AuthService.js';
import { AuthMiddleware, type AuthenticatedRequest } from '../middleware/AuthMiddleware.js';
import {
  RegisterDto, VerifyEmailDto, LoginDto, RefreshTokenDto, LogoutDto,
  ResendVerificationDto, ForgotPasswordDto, ResetPasswordDto, UpdateProfileDto,
} from '../classes/validators/AuthValidators.js';

@JsonController('/auth')
@injectable()
export class AuthController {
  constructor(@inject(AUTH_TYPES.AuthService) private readonly authService: AuthService) {}

  @Post('/register')
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('/verify-email')
  verifyEmail(@Body() body: VerifyEmailDto) {
    return this.authService.verifyEmail(body.token);
  }

  @Post('/resend-verification')
  resendVerification(@Body() body: ResendVerificationDto) {
    return this.authService.resendVerification(body.email);
  }

  @Post('/login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post('/refresh')
  refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('/logout')
  logout(@Body() body: LogoutDto) {
    return this.authService.logout(body.refreshToken);
  }

  @Post('/forgot-password')
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('/reset-password')
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }

  @Get('/me')
  @UseBefore(AuthMiddleware)
  me(@CurrentUser({ required: false }) _currentUser: unknown, request: AuthenticatedRequest) {
    return this.authService.getProfile(request.authUser!.id);
  }

  @Patch('/me')
  @UseBefore(AuthMiddleware)
  updateMe(@Body() body: UpdateProfileDto, request: AuthenticatedRequest) {
    return this.authService.updateProfile(request.authUser!.id, body.username);
  }
}
