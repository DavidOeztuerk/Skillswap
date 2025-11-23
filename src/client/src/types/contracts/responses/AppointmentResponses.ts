// Additional Appointment Response Types

export interface TimeSlot {
  startTime: string;  // ISO date string
  endTime: string;    // ISO date string
  isAvailable: boolean;
  durationMinutes?: number;
}

export interface AppointmentStatisticsResponse {
  totalAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  averageRating?: number;
  totalDurationMinutes?: number;
  totalSessionsCompleted?: number;
  noShowCount?: number;
}

export interface AvailabilityPreferences {
  timezone: string;
  weeklySchedule: {
    monday?: DayAvailability;
    tuesday?: DayAvailability;
    wednesday?: DayAvailability;
    thursday?: DayAvailability;
    friday?: DayAvailability;
    saturday?: DayAvailability;
    sunday?: DayAvailability;
  };
  minSessionDuration?: number;
  maxSessionDuration?: number;
  bufferBetweenSessions?: number;
  autoAcceptBookings?: boolean;
}

export interface DayAvailability {
  enabled: boolean;
  timeSlots: Array<{
    startTime: string;  // HH:mm format
    endTime: string;    // HH:mm format
  }>;
}
