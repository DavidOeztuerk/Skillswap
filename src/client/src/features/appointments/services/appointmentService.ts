import { apiClient } from '../../../core/api/apiClient';
import { APPOINTMENT_ENDPOINTS } from '../../../core/config/endpoints';
import { type Appointment, AppointmentStatus } from '../types/Appointment';
import type { PagedResponse, ApiResponse } from '../../../shared/types/api/UnifiedResponse';
import type { AppointmentRequest } from '../types/AppointmentRequest';
import type { AppointmentResponse } from '../types/AppointmentResponse';
import type {
  TimeSlot,
  AppointmentStatisticsResponse,
  AvailabilityPreferences,
} from '../types/AppointmentResponses';
import type { RescheduleAppointmentRequest } from '../types/RescheduleAppointmentRequest';
import type { RescheduleAppointmentResponse } from '../types/RescheduleAppointmentResponse';

const APPOINTMENT_ID_REQUIRED_ERROR = 'Termin-ID ist erforderlich';

export interface GetUserAppointmentsRequest {
  status?: string;
  fromDate?: Date;
  toDate?: Date;
  includePast?: boolean;
  pageNumber?: number;
  pageSize?: number;
}

export interface UserAppointmentResponse {
  appointmentId: string;
  title: string;
  scheduledDate: string; // ISO string
  durationMinutes: number;
  status: string;
  otherPartyUserId: string;
  otherPartyName: string;
  meetingType: string;
  isOrganizer: boolean;

  // Connection-level data (NEW MODEL)
  connectionId: string;
  connectionType: string; // "SkillExchange" | "Payment" | "Free"
  connectionStatus: string;

  // Series-level data (NEW MODEL)
  sessionSeriesId: string;
  sessionSeriesTitle: string;
  sessionNumber: number;
  totalSessionsInSeries: number;
  completedSessionsInSeries: number;

  // Derived flags for frontend compatibility
  isSkillExchange: boolean; // true if connectionType === "SkillExchange"
  isMonetary: boolean; // true if connectionType === "Payment"

  // Session-specific data
  meetingLink?: string;
  isConfirmed: boolean;
  isPaymentCompleted: boolean;
  paymentAmount?: number;
  currency?: string;

  // Additional metadata
  skillId?: string;
  description?: string;
}

export interface PagedUserAppointmentsResponse {
  Data: UserAppointmentResponse[];
  PageNumber: number;
  PageSize: number;
  TotalCount: number;
  TotalPages: number;
  HasNextPage: boolean;
  HasPreviousPage: boolean;
}
/**
 * Service for appointment operations
 */
const appointmentService = {
  /**
   * Get all user appointments
   */
  async getAppointments(
    request: GetUserAppointmentsRequest
  ): Promise<PagedResponse<UserAppointmentResponse>> {
    const params: Record<string, unknown> = {};
    if (request.status != null) params.status = request.status;
    if (request.fromDate != null) params.fromDate = request.fromDate.toISOString();
    if (request.toDate != null) params.toDate = request.toDate.toISOString();
    if (request.includePast !== undefined) params.includePast = request.includePast;
    if (request.pageNumber != null) params.pageNumber = request.pageNumber;
    if (request.pageSize != null) params.pageSize = request.pageSize;

    return apiClient.getPaged<UserAppointmentResponse>(APPOINTMENT_ENDPOINTS.GET_MY, params);
  },

  /**
   * Get single appointment by ID
   */
  async getAppointment(appointmentId: string): Promise<ApiResponse<Appointment>> {
    if (!appointmentId.trim()) throw new Error(APPOINTMENT_ID_REQUIRED_ERROR);
    return apiClient.get<Appointment>(`${APPOINTMENT_ENDPOINTS.GET_SINGLE}/${appointmentId}`);
  },

  /**
   * Create new appointment
   */
  async createAppointment(appointmentData: AppointmentRequest): Promise<ApiResponse<Appointment>> {
    if (!appointmentData.title) {
      throw new Error('Titel ist erforderlich');
    }
    if (!appointmentData.scheduledDate) {
      throw new Error('Terminzeit ist erforderlich');
    }
    if (!appointmentData.durationMinutes) {
      throw new Error('Dauer ist erforderlich');
    }
    if (!appointmentData.participantUserId) {
      throw new Error('Teilnehmer-ID ist erforderlich');
    }

    return apiClient.post<Appointment>(APPOINTMENT_ENDPOINTS.CREATE, appointmentData);
  },

  /**
   * Accept appointment
   */
  async acceptAppointment(appointmentId: string): Promise<ApiResponse<AppointmentResponse>> {
    if (!appointmentId.trim()) throw new Error(APPOINTMENT_ID_REQUIRED_ERROR);
    return apiClient.post<AppointmentResponse>(
      `${APPOINTMENT_ENDPOINTS.ACCEPT}/${appointmentId}/accept`
    );
  },

  /**
   * Cancel appointment
   */
  async cancelAppointment(
    appointmentId: string,
    reason?: string
  ): Promise<ApiResponse<AppointmentResponse>> {
    if (!appointmentId.trim()) throw new Error(APPOINTMENT_ID_REQUIRED_ERROR);
    return apiClient.post<AppointmentResponse>(
      `${APPOINTMENT_ENDPOINTS.CANCEL}/${appointmentId}/cancel`,
      { reason }
    );
  },

  /**
   */
  async respondToAppointment(
    appointmentId: string,
    status: AppointmentStatus
  ): Promise<ApiResponse<AppointmentResponse>> {
    if (status === AppointmentStatus.Confirmed) {
      return this.acceptAppointment(appointmentId);
    }
    return this.cancelAppointment(appointmentId);
  },

  /**
   * Complete appointment
   */
  async completeAppointment(appointmentId: string): Promise<ApiResponse<AppointmentResponse>> {
    if (!appointmentId.trim()) throw new Error(APPOINTMENT_ID_REQUIRED_ERROR);
    return apiClient.post<AppointmentResponse>(
      APPOINTMENT_ENDPOINTS.COMPLETE_SESSION.replace('{appointmentId}', appointmentId)
    );
  },

  /**
   * Get upcoming appointments (filtered version of getAppointments)
   */
  async getUpcomingAppointments(limit?: number): Promise<PagedResponse<UserAppointmentResponse>> {
    const now = new Date();
    const request: GetUserAppointmentsRequest = {
      fromDate: now,
      includePast: false,
      pageSize: limit ?? 12,
    };
    return this.getAppointments(request);
  },

  /**
   * Get past appointments with pagination (filtered version of getAppointments)
   */
  async getPastAppointments(params?: {
    page?: number;
    limit?: number;
  }): Promise<PagedResponse<UserAppointmentResponse>> {
    const now = new Date();
    const request: GetUserAppointmentsRequest = {
      toDate: now,
      includePast: true,
      pageNumber: params?.page ?? 1,
      pageSize: params?.limit ?? 12,
    };
    return this.getAppointments(request);
  },

  /**
   * Get available time slots between current user and another user
   */
  async getAvailableSlots(
    otherUserId: string,
    options?: {
      preferredDaysOfWeek?: number[];
      preferredTimeSlots?: string[];
      sessionDurationMinutes?: number;
      numberOfSlots?: number;
    }
  ): Promise<ApiResponse<TimeSlot[]>> {
    if (!otherUserId.trim()) throw new Error('Benutzer-ID ist erforderlich');

    const body = {
      otherUserId,
      preferredDaysOfWeek: options?.preferredDaysOfWeek,
      preferredTimeSlots: options?.preferredTimeSlots,
      sessionDurationMinutes: options?.sessionDurationMinutes ?? 60,
      numberOfSlots: options?.numberOfSlots ?? 10,
    };

    return apiClient.post<TimeSlot[]>(APPOINTMENT_ENDPOINTS.AVAILABLE_SLOTS, body);
  },

  /**
   * Update appointment details (title, description, meetingLink)
   */
  async updateAppointment(
    appointmentId: string,
    updates: { title?: string; description?: string; meetingLink?: string }
  ): Promise<ApiResponse<AppointmentResponse>> {
    if (!appointmentId.trim()) throw new Error(APPOINTMENT_ID_REQUIRED_ERROR);

    return apiClient.put<AppointmentResponse>(
      `${APPOINTMENT_ENDPOINTS.UPDATE}/${appointmentId}`,
      updates
    );
  },

  /**
   * Reschedule appointment
   */
  async rescheduleAppointment(
    appointmentId: string,
    newScheduledDate: string,
    newDuration?: number,
    reason?: string
  ): Promise<ApiResponse<RescheduleAppointmentResponse>> {
    if (!appointmentId.trim()) throw new Error(APPOINTMENT_ID_REQUIRED_ERROR);
    if (!newScheduledDate) throw new Error('Neuer Zeitpunkt ist erforderlich');

    const request: RescheduleAppointmentRequest = {
      newScheduledDate,
      newDurationMinutes: newDuration,
      reason,
    };

    return apiClient.post<RescheduleAppointmentResponse>(
      APPOINTMENT_ENDPOINTS.RESCHEDULE.replace('{appointmentId}', appointmentId),
      request
    );
  },

  /**
   * Generate meeting link for appointment
   */
  async generateMeetingLink(appointmentId: string): Promise<ApiResponse<string>> {
    if (!appointmentId.trim()) throw new Error(APPOINTMENT_ID_REQUIRED_ERROR);

    return apiClient.post<string>(
      APPOINTMENT_ENDPOINTS.GENERATE_MEETING_LINK.replace('{appointmentId}', appointmentId)
    );
  },

  /**
   * Rate completed appointment
   */
  async rateAppointment(
    appointmentId: string,
    rating: number,
    feedback?: string
  ): Promise<ApiResponse<AppointmentResponse>> {
    if (!appointmentId.trim()) throw new Error(APPOINTMENT_ID_REQUIRED_ERROR);
    if (rating < 1 || rating > 5) throw new Error('Bewertung muss zwischen 1 und 5 liegen');

    return apiClient.post<AppointmentResponse>(
      `${APPOINTMENT_ENDPOINTS.RATE_SESSION}/${appointmentId}/rate-session`,
      { rating, feedback }
    );
  },

  /**
   * Report problematic appointment for moderation review
   */
  async reportAppointment(
    appointmentId: string,
    reason: string,
    details?: string
  ): Promise<ApiResponse<{ reportId: string; status: string; message: string }>> {
    if (!appointmentId.trim()) throw new Error(APPOINTMENT_ID_REQUIRED_ERROR);
    if (!reason.trim()) throw new Error('Grund ist erforderlich');

    return apiClient.post<{ reportId: string; status: string; message: string }>(
      `${APPOINTMENT_ENDPOINTS.REPORT}/${appointmentId}/report`,
      { reason, details }
    );
  },

  /**
   * Get appointment statistics for a user (or current user if no userId provided)
   */
  async getAppointmentStatistics(
    userId?: string
  ): Promise<ApiResponse<AppointmentStatisticsResponse>> {
    const endpoint = userId
      ? `${APPOINTMENT_ENDPOINTS.GET_STATISTICS}/${userId}`
      : APPOINTMENT_ENDPOINTS.GET_STATISTICS;
    return apiClient.get<AppointmentStatisticsResponse>(endpoint);
  },

  /**
   * Send appointment reminder to both participants
   */
  async sendAppointmentReminder(appointmentId: string, minutesBefore?: number): Promise<void> {
    if (!appointmentId.trim()) throw new Error(APPOINTMENT_ID_REQUIRED_ERROR);
    await apiClient.post(`${APPOINTMENT_ENDPOINTS.GET_SINGLE}/${appointmentId}/reminder`, {
      minutesBefore: minutesBefore ?? 15,
    });
  },

  /**
   * Get user availability preferences
   */
  async getAvailabilityPreferences(userId?: string): Promise<ApiResponse<AvailabilityPreferences>> {
    const endpoint = userId
      ? `${APPOINTMENT_ENDPOINTS.GET_AVAILABILITY}/${userId}`
      : APPOINTMENT_ENDPOINTS.GET_AVAILABILITY;
    return apiClient.get<AvailabilityPreferences>(endpoint);
  },

  /**
   * Update user availability preferences
   */
  async updateAvailabilityPreferences(
    preferences: Partial<AvailabilityPreferences>
  ): Promise<ApiResponse<AvailabilityPreferences>> {
    return apiClient.put<AvailabilityPreferences>(
      APPOINTMENT_ENDPOINTS.SET_AVAILABILITY,
      preferences
    );
  },
};

export default appointmentService;
