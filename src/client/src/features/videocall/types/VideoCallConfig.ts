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
  initiatorAvatarUrl?: string | null; // NEU: Avatar-URL für Initiator
  participantName: string;
  participantAvatarUrl?: string | null; // NEU: Avatar-URL für Participant
  recordingUrl?: string | null;
  isRecorded: boolean;
  sessionId: string;
  startedAt?: Date | null;
}
