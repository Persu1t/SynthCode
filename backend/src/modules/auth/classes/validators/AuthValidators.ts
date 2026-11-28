import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
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

export class SignupResponse {
  @JSONSchema({
    description: 'Unique identifier of User',
    example: "6b0939b2c456f9e54613ebfa",
    type: 'string',
    readOnly: true,
  })

  @IsNotEmpty()
  @IsString()
  id: string;
}
