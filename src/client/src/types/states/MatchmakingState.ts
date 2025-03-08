import { RequestState } from '../common/RequestState';
import { Match } from '../models/Match';
import { User } from '../models/User';

export interface MatchmakingState extends RequestState {
  matches: Match[];
  activeMatch: Match | null;
  matchResults: User[];
  matchRequestSent: boolean;
}
