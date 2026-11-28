import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { JSONSchema } from 'class-validator-jsonschema';

export class RegisterDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(32)
  username!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

export class VerifyEmailDto {
  @IsString()
  @MinLength(32)
  token!: string;
}

export class LoginDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}

export class RefreshTokenDto {
  @IsString()
  @MinLength(20)
  refreshToken!: string;
}

export class LogoutDto extends RefreshTokenDto {}

export class ResendVerificationDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(32)
  token!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword!: string;
}

export class UpdateProfileDto {
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  username!: string;
}

export class MessageResponseDto {
  @JSONSchema({ description: 'Human-readable result message', example: 'Operation completed successfully' })
  @IsString()
  message!: string;
}

export class AuthUserResponseDto {
  @JSONSchema({ description: 'Unique user identifier', example: '6b0939b2c456f9e54613ebfa' })
  @IsString()
  id!: string;

  @JSONSchema({ example: 'developer@example.com' })
  @IsEmail()
  email!: string;

  @JSONSchema({ example: 'developer' })
  @IsString()
  username!: string;

  @JSONSchema({ example: 'user' })
  @IsString()
  role!: string;

  @JSONSchema({ example: true })
  @IsBoolean()
  verified!: boolean;
}

export class AuthTokenResponseDto {
  @IsString()
  accessToken!: string;

  @IsString()
  refreshToken!: string;

  @JSONSchema({ example: 'Bearer' })
  @IsString()
  tokenType!: string;

  @IsNumber()
  expiresIn!: number;

  @JSONSchema({ description: 'Authenticated user information', $ref: '#/components/schemas/AuthUserResponseDto' })
  user!: AuthUserResponseDto;
}

export class UserProfileResponseDto extends AuthUserResponseDto {}

export class AuthErrorResponseDto {
  @JSONSchema({ example: 'UnauthorizedError' })
  @IsString()
  error!: string;

  @JSONSchema({ example: 'Invalid or expired access token' })
  @IsString()
  message!: string;
}

/** Kept for compatibility with existing imports; registration returns a message, not an id. */
export class SignupResponse extends MessageResponseDto {}
