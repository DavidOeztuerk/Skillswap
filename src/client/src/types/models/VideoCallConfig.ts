export interface VideoCallConfig {
  roomId: string;
  peerId: string;
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
