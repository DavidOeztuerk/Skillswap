export interface AppointmentRequest {
  matchId: string;
  startTime: string;
  endTime: string;
  notes?: string;
}
