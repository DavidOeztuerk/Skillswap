/**
 * VideoCall API Response Types
 * Matches backend contracts from: src/shared/Contracts/VideoCall/Responses/
 */

/**
 * Response from POST /api/calls/join
 * Backend: Contracts.VideoCall.Responses.JoinCallResponse
 */
export interface JoinCallResponse {
  sessionId: string;
  roomId: string;
  success: boolean;
  otherParticipants: string[];
  apiVersion?: string;
}

/**
 * Response from POST /api/calls/leave
 * Backend: Contracts.VideoCall.Responses.LeaveCallResponse
 */
export interface LeaveCallResponse {
  sessionId: string;
  success: boolean;
  apiVersion?: string;
}

/**
 * Response from POST /api/calls/end
 * Backend: Contracts.VideoCall.Responses.EndCallResponse
 */
export interface EndCallResponse {
  sessionId: string;
  endedAt: string; // ISO DateTime string
  durationSeconds: number;
  rating: number | null;
  apiVersion?: string;
}

/**
 * Response from POST /api/calls/start
 * Backend: Contracts.VideoCall.Responses.StartCallResponse
 */
export interface StartCallResponse {
  sessionId: string;
  startedAt: string; // ISO DateTime string
  roomId: string;
  apiVersion?: string;
}

/**
 * Response from POST /api/calls/create
 * Backend: Contracts.VideoCall.Responses.CreateCallSessionResponse
 */
export interface CreateCallSessionResponse {
  sessionId: string;
  roomId: string;
  appointmentId?: string;
  matchId?: string;
  initiatorUserId: string;
  participantUserId?: string;
  status: string;
  createdAt: string; // ISO DateTime string
  apiVersion?: string;
}

/**
 * Response from GET /api/calls/{sessionId}
 * Backend: Contracts.VideoCall.Responses.GetCallSessionResponse
 */
export interface GetCallSessionResponse {
  sessionId: string;
  roomId: string;
  appointmentId?: string;
  matchId?: string;
  initiatorUserId: string;
  participantUserId?: string;
  initiatorName?: string;
  participantName?: string;
  initiatorAvatarUrl?: string;
  participantAvatarUrl?: string;
  status: string;
  startedAt?: string;
  endedAt?: string;
  durationMinutes?: number;
  maxParticipants: number;
  participantCount: number;
  isRecorded: boolean;
  recordingUrl?: string;
  iceServers?: RTCIceServer[];
  createdAt: string;
  apiVersion?: string;
  /** ThreadId from MatchRequest (SHA256-GUID format) for Chat integration */
  threadId?: string;
}

/**
 * Response from GET /api/statistics
 * Backend: Contracts.VideoCall.Responses.GetCallStatisticsResponse
 */
export interface GetCallStatisticsResponse {
  totalCalls: number;
  completedCalls: number;
  cancelledCalls: number;
  averageDurationMinutes: number;
  totalDurationMinutes: number;
  uniqueParticipants: number;
  callsByStatus: Record<string, number>;
  fromDate?: string;
  toDate?: string;
}

/**
 * Response for call info save operation (local only - no backend endpoint)
 * Used for consistency in thunk return types
 */
export interface SaveCallInfoResponse {
  roomId: string;
  durationSaved: number;
  savedAt: string;
}

/**
 * Response for technical issue report (local only - no backend endpoint yet)
 * Used for consistency in thunk return types
 */
export interface ReportIssueResponse {
  roomId: string;
  issue: string;
  reportedAt: string;
}
