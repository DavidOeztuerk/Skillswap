import { User } from '../../models/User';

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginResponse {
  token: string;
}
