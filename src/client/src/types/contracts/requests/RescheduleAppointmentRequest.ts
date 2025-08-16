/**
 * Request contract for rescheduling an appointment
 * Matches the backend RescheduleAppointmentRequest contract
 */
export interface RescheduleAppointmentRequest {
  /**
   * New scheduled date and time for the appointment (ISO-8601 format with timezone)
   */
  newScheduledDate: string;
  
  /**
   * New duration in minutes (optional, keeps original if not provided)
   * Must be between 15 and 480 minutes
   */
  newDurationMinutes?: number;
  
  /**
   * Optional reason for rescheduling
   * Maximum 500 characters
   */
  reason?: string;
}