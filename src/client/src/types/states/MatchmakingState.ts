import { RequestState } from '../common/RequestState';
import { MatchRequest } from '../contracts/requests/MatchRequest';
import { Match } from '../models/Match';
import { User } from '../models/User';

export interface MatchmakingState extends RequestState {
  matches: Match[];
  activeMatch: Match | null;
  matchResults: User[];
  matchRequestSent: boolean;
  incomingRequests: MatchRequest[];
  outgoingRequests: MatchRequest[];
}
