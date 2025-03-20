import { RequestState } from '../common/RequestState';
import { User } from '../models/User';

export interface AuthState extends RequestState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}
