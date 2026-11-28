import type { RegisterDto, LoginDto } from '../classes/validators/AuthValidators.js';

export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
    verified: boolean;
  };
}

export interface IAuthService {
  register(input: RegisterDto): Promise<{ message: string }>;
  verifyEmail(token: string): Promise<{ message: string }>;
  login(input: LoginDto): Promise<AuthTokenResponse>;
  refresh(refreshToken: string): Promise<AuthTokenResponse>;
  logout(refreshToken: string): Promise<{ message: string }>;
}
