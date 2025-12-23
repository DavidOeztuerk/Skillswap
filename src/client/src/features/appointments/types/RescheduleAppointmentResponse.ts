/**
 * Response contract for reschedule appointment operation
 * Matches the backend RescheduleAppointmentResponse contract
 */
export interface RescheduleAppointmentResponse {
  /**
   * Unique identifier for the rescheduled appointment
   */
  appointmentId: string;

  /**
   * New scheduled date and time for the appointment (ISO-8601 format with timezone)
   */
  newScheduledDate: string;

  /**
   * New duration in minutes for the appointment
   */
  newDurationMinutes: number;

  /**
   * Date and time when the appointment was rescheduled (ISO-8601 format with timezone)
   */
  updatedAt: string;

  /**
   * API Version this response supports
   */
  apiVersion?: string;
}
