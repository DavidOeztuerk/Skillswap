import { APPOINTMENT_ENDPOINTS } from '../../config/endpoints';
import { Appointment, AppointmentStatus } from '../../types/models/Appointment';
import { AppointmentRequest } from '../../types/contracts/requests/AppointmentRequest';
import { AppointmentResponse } from '../../types/contracts/responses/AppointmentResponse';
import { RescheduleAppointmentRequest } from '../../types/contracts/requests/RescheduleAppointmentRequest';
import { RescheduleAppointmentResponse } from '../../types/contracts/responses/RescheduleAppointmentResponse';
import { apiClient } from '../apiClient';
import { ApiResponse, PagedResponse } from '../../types/api/UnifiedResponse';

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
  scheduledDate: string; // Changed to string since API sends ISO string
  durationMinutes: number;
  status: string;
  otherPartyUserId: string;
  otherPartyName: string;
  meetingType: string;
  isOrganizer: boolean;
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
  async getAppointments(request: GetUserAppointmentsRequest): Promise<PagedResponse<UserAppointmentResponse>> {
    const params: Record<string, unknown> = {};
    if (request.status != null) params.status = request.status;
    if (request.fromDate != null) params.fromDate = request.fromDate.toISOString();
    if (request.toDate != null) params.toDate = request.toDate.toISOString();
    if (request.includePast != undefined) params.includePast = request.includePast;
    if (request.pageNumber != null) params.pageNumber = request.pageNumber;
    if (request.pageSize != null) params.pageSize = request.pageSize;
    
    return await apiClient.getPaged<UserAppointmentResponse>(
      APPOINTMENT_ENDPOINTS.GET_MY,
      params
    ) as PagedResponse<UserAppointmentResponse>;
  },

  /**
   * Get single appointment by ID
   */
  async getAppointment(appointmentId: string): Promise<ApiResponse<Appointment>> {
    if (!appointmentId?.trim()) throw new Error('Termin-ID ist erforderlich');
    return await apiClient.get<Appointment>(`${APPOINTMENT_ENDPOINTS.GET_SINGLE}/${appointmentId}`);
  },

  /**
   * Create new appointment
   */
  async createAppointment(appointmentData: AppointmentRequest): Promise<ApiResponse<Appointment>> {
    if (!appointmentData.matchId) throw new Error('Match-ID ist erforderlich');
    if (!appointmentData.startTime) throw new Error('Startzeitpunkt ist erforderlich');
    if (!appointmentData.endTime) throw new Error('Endzeitpunkt ist erforderlich');
    return await apiClient.post<Appointment>(APPOINTMENT_ENDPOINTS.CREATE, appointmentData);
  },

  /**
   * Accept appointment
   */
  async acceptAppointment(appointmentId: string): Promise<ApiResponse<AppointmentResponse>> {
    if (!appointmentId?.trim()) throw new Error('Termin-ID ist erforderlich');
    return await apiClient.post<AppointmentResponse>(`${APPOINTMENT_ENDPOINTS.ACCEPT}/${appointmentId}/accept`);
  },

  /**
   * Cancel appointment
   */
  async cancelAppointment(appointmentId: string, reason?: string): Promise<ApiResponse<AppointmentResponse>> {
    if (!appointmentId?.trim()) throw new Error('Termin-ID ist erforderlich');
    return await apiClient.post<AppointmentResponse>(`${APPOINTMENT_ENDPOINTS.CANCEL}/${appointmentId}/cancel`, { reason });
  },

  /**
   */
  async respondToAppointment(
    appointmentId: string,
    status: AppointmentStatus
  ): Promise<ApiResponse<AppointmentResponse>> {
    if (status === AppointmentStatus.Confirmed) {
      return this.acceptAppointment(appointmentId);
    } else {
      return this.cancelAppointment(appointmentId);
    }
  },

  /**
   * Complete appointment - Note: This endpoint may not exist in backend
   */
  async completeAppointment(appointmentId: string): Promise<ApiResponse<AppointmentResponse>> {
    if (!appointmentId?.trim()) throw new Error('Termin-ID ist erforderlich');
    return await apiClient.post<AppointmentResponse>(`${APPOINTMENT_ENDPOINTS.GET_SINGLE}/${appointmentId}/complete`);
  },

  /**
   * Get upcoming appointments (filtered version of getAppointments)
   */
  async getUpcomingAppointments(limit?: number): Promise<PagedResponse<UserAppointmentResponse>> {
    const now = new Date();
    const request: GetUserAppointmentsRequest = {
      fromDate: now,
      includePast: false,
      pageSize: limit || 12
    };
    return this.getAppointments(request);
  },

  /**
   * Get past appointments with pagination (filtered version of getAppointments)
   */
  async getPastAppointments(params?: { page?: number; limit?: number }): Promise<PagedResponse<UserAppointmentResponse>> {
    const now = new Date();
    const request: GetUserAppointmentsRequest = {
      toDate: now,
      includePast: true,
      pageNumber: params?.page || 1,
      pageSize: params?.limit || 12
    };
    return this.getAppointments(request);
  },

  /**
   * Get available time slots for a user - Note: This endpoint may not exist in backend
   */
  async getAvailableSlots(userId: string, date: string): Promise<any[]> {
    if (!userId?.trim()) throw new Error('Benutzer-ID ist erforderlich');
    if (!date?.trim()) throw new Error('Datum ist erforderlich');
    // This endpoint doesn't exist in backend - would need to be implemented
    throw new Error('Available slots endpoint not implemented in backend');
  },

  /**
   * Update appointment details - Note: This endpoint may not exist in backend
   */
  async updateAppointment(appointmentId: string, _: Partial<Appointment>): Promise<Appointment> {
    if (!appointmentId?.trim()) throw new Error('Termin-ID ist erforderlich');
    // This endpoint doesn't exist in backend - would need to be implemented
    throw new Error('Update appointment endpoint not implemented in backend');
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
    if (!appointmentId?.trim()) throw new Error('Termin-ID ist erforderlich');
    if (!newScheduledDate) throw new Error('Neuer Zeitpunkt ist erforderlich');
    
    const request: RescheduleAppointmentRequest = {
      newScheduledDate,
      newDurationMinutes: newDuration,
      reason
    };
    
    return apiClient.post<RescheduleAppointmentResponse>(
      `${APPOINTMENT_ENDPOINTS.RESCHEDULE.replace('{appointmentId}', appointmentId)}`,
      request
    );
  },

  /**
   * Generate meeting link for appointment
   */
  async generateMeetingLink(appointmentId: string): Promise<ApiResponse<string>> {
    if (!appointmentId?.trim()) throw new Error('Termin-ID ist erforderlich');
    
    return apiClient.post<string>(
      APPOINTMENT_ENDPOINTS.GENERATE_MEETING_LINK.replace('{appointmentId}', appointmentId)
    );
  },

  /**
   * Rate completed appointment - Note: This endpoint may not exist in backend
   */
  async rateAppointment(appointmentId: string, rating: number, _?: string): Promise<Appointment> {
    if (!appointmentId?.trim()) throw new Error('Termin-ID ist erforderlich');
    if (rating < 1 || rating > 5) throw new Error('Bewertung muss zwischen 1 und 5 liegen');
    await apiClient.post<{ success: boolean }>(`${APPOINTMENT_ENDPOINTS.GET_SINGLE}/${appointmentId}/rate`, { rating });
    return { id: appointmentId } as any;
  },

  /**
   * Report problematic appointment - Note: This endpoint may not exist in backend
   */
  async reportAppointment(appointmentId: string, reason: string, _: string): Promise<void> {
    if (!appointmentId?.trim()) throw new Error('Termin-ID ist erforderlich');
    if (!reason?.trim()) throw new Error('Grund ist erforderlich');
    // This endpoint doesn't exist in backend - would need to be implemented
    throw new Error('Report appointment endpoint not implemented in backend');
  },

  /**
   * Get appointment statistics - Note: This endpoint may not exist in backend
   */
  async getAppointmentStatistics(_?: string): Promise<any> {
    return apiClient.get<any>(APPOINTMENT_ENDPOINTS.GET_STATISTICS);
  },

  /**
   * Send appointment reminder - Note: This endpoint may not exist in backend
   */
  async sendAppointmentReminder(appointmentId: string): Promise<void> {
    if (!appointmentId?.trim()) throw new Error('Termin-ID ist erforderlich');
    await apiClient.post<void>(`${APPOINTMENT_ENDPOINTS.GET_SINGLE}/${appointmentId}/reminder`, { minutesBefore: 15 });
  },

  /**
   * Get user availability preferences - Note: This endpoint may not exist in backend
   */
  async getAvailabilityPreferences(): Promise<any> {
    // This endpoint doesn't exist in backend - would need to be implemented
    throw new Error('Availability preferences endpoint not implemented in backend');
  },

  /**
   * Update user availability preferences - Note: This endpoint may not exist in backend
   */
  async updateAvailabilityPreferences(_: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    // This endpoint doesn't exist in backend - would need to be implemented
    throw new Error('Update availability preferences endpoint not implemented in backend');
  },
};

export default appointmentService;
