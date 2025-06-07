import { User } from '../../models/User';

export interface RegisterResponse {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  tokens: Tokens;
  emailVerificationRequired: boolean;
}

export interface LoginResponse {
  userId: string;
  profile: User;
  tokens: Tokens;
  requiresEmailVerification: boolean;
  requiredTwoFactor: boolean;
  lastLogout: Date | null;
}

// export interface LoginResponse {
//   token: string;
//   refreshToken: string;
// }

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  tokenType: string;
  expiresIn: number;
}
