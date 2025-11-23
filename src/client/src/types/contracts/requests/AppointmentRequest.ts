/**
 * Frontend contract for creating appointments - MUST match backend CreateAppointmentRequest.cs
 */
export interface AppointmentRequest {
  title: string;  // Required: Title of the appointment
  description?: string;  // Optional: Description
  scheduledDate: string;  // Required: ISO DateTime string
  durationMinutes: number;  // Required: Duration in minutes (1-480)
  participantUserId: string;  // Required: ID of the other participant
  skillId?: string;  // Optional: Related skill
  matchId?: string;  // Optional: Related match
  meetingType?: 'VideoCall' | 'InPerson' | 'Phone' | 'Online';  // Optional: defaults to VideoCall
}
