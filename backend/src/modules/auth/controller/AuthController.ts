import { inject, injectable } from 'inversify';
import { Body, Get, JsonController, Patch, Post, Req, UseBefore } from 'routing-controllers';
import { AUTH_TYPES } from '../types.js';
import { AuthService } from '../service/AuthService.js';
import { AuthMiddleware, type AuthenticatedRequest } from '../middleware/AuthMiddleware.js';
import {
  RegisterDto, VerifyEmailDto, LoginDto, RefreshTokenDto, LogoutDto,
  ResendVerificationDto, ForgotPasswordDto, ResetPasswordDto, UpdateProfileDto,
  SignupResponse,
} from '../classes/validators/AuthValidators.js';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

@OpenAPI({
  tags: ['Authentication'],
  description: 'Authentication and authorization operations'
})
@JsonController('/auth')
@injectable()
export class AuthController {
  constructor(@inject(AUTH_TYPES.AuthService) private readonly authService: AuthService) {}


  @OpenAPI({
    summary: 'Register a new user account',
    description:
      'Registers a new user using Firebase Authentication and stores additional user details in the application database. This is typically the first step for any new user to access the system.',
  })

  @ResponseSchema(SignupResponse, {
    statusCode: 200,
    description: 'User registered successfully. A verification email has been sent.',
  })
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
  me(@Req() request: AuthenticatedRequest) {
    return this.authService.getProfile(request.authUser!.id);
  }

  @Patch('/me')
  @UseBefore(AuthMiddleware)
  updateMe(@Body() body: UpdateProfileDto, @Req() request: AuthenticatedRequest) {
    return this.authService.updateProfile(request.authUser!.id, body.username);
  }
}
