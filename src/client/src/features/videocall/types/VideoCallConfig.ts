export interface VideoCallConfig {
  roomId: string;
  peerId?: string; // Optional - derived from participantUserId in Redux
  // optional extras
  iceServers?: RTCIceServer[];
  initiatorUserId?: string;
  participantUserId?: string;
  durationMinutes?: number | null;

  endedAt?: Date | null;
  initiatorName: string;
  initiatorAvatarUrl?: string | null;
  participantName: string;
  participantAvatarUrl?: string | null;
  recordingUrl?: string | null;
  isRecorded: boolean;
  sessionId: string;
  startedAt?: Date | null;

  // Chat/Thread info - ThreadId from MatchRequest for Chat integration
  threadId?: string | null;
}
