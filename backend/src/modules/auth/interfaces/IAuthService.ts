import type {
  RegisterDto,
  LoginDto,
} from '../classes/validators/AuthValidators.js';

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: {
    id: string | null;
    email: string;
    username: string;
    role: string;
    verified: boolean;
  };
}

export interface IAuthService {
  register(input: RegisterDto): Promise<{ message: string }>;
  verifyEmail(token: string): Promise<{ message: string }>;
  resendVerification(email: string): Promise<{ message: string }>;
  login(input: LoginDto): Promise<AuthTokenResponse>;
  refresh(refreshToken: string): Promise<AuthTokenResponse>;
  logout(refreshToken: string): Promise<{ message: string }>;
  forgotPassword(email: string): Promise<{ message: string }>;
  resetPassword(token: string, newPassword: string): Promise<{ message: string }>;
  getProfile(userId: string): Promise<Record<string, unknown>>;
  updateProfile(userId: string, username: string): Promise<{ message: string }>;
}
