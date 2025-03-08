import { MatchStatus } from './Match';

export interface MatchFilter {
  status?: MatchStatus;
  role?: 'requester' | 'responder';
}
