import { RequestState } from '../common/RequestState';
import { User } from '../models/User';
import { LoginRequest } from '../contracts/requests/LoginRequest';

export interface AuthState extends RequestState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  twoFactorRequired: boolean;
  twoFactorEnabled: boolean;
  pendingLoginCredentials: LoginRequest | null;
}
