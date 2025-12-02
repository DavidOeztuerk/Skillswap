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
  participantName: string;
  recordingUrl?: string | null;
  isRecorded: boolean;
  sessionId: string;
  startedAt?: Date | null;
}
