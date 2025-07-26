// src/api/services/appointmentService.ts
import { APPOINTMENT_ENDPOINTS } from '../../config/endpoints';
import { Appointment, AppointmentStatus } from '../../types/models/Appointment';
import { AppointmentRequest } from '../../types/contracts/requests/AppointmentRequest';
import { AppointmentResponse } from '../../types/contracts/responses/AppointmentResponse';
import apiClient from '../apiClient';

export interface GetUserAppointmentsRequest {
  Status?: string;
  FromDate?: Date;
  ToDate?: Date;
  IncludePast?: boolean;
  PageNumber?: number;
  PageSize?: number;
}

export interface UserAppointmentResponse {
  AppointmentId: string;
  Title: string;
  ScheduledDate: Date;
  DurationMinutes: number;
  Status: string;
  OtherPartyUserId: string;
  OtherPartyName: string;
  MeetingType: string;
  Location?: string;
  IsOrganizer: boolean;
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
  async getAppointments(request: GetUserAppointmentsRequest = {}): Promise<PagedUserAppointmentsResponse> {
    const queryParams = new URLSearchParams();
    if (request.Status) queryParams.append('Status', request.Status);
    if (request.FromDate) queryParams.append('FromDate', request.FromDate.toISOString());
    if (request.ToDate) queryParams.append('ToDate', request.ToDate.toISOString());
    if (request.IncludePast !== undefined) queryParams.append('IncludePast', request.IncludePast.toString());
    if (request.PageNumber) queryParams.append('PageNumber', request.PageNumber.toString());
    if (request.PageSize) queryParams.append('PageSize', request.PageSize.toString());
    
    const url = `${APPOINTMENT_ENDPOINTS.GET_MY}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return apiClient.get<PagedUserAppointmentsResponse>(url);
    // return apiClient.get<PagedUserAppointmentsResponse>(APPOINTMENT_ENDPOINTS.GET_MY, { request })
  },

  /**
   * Get single appointment by ID
   */
  async getAppointment(appointmentId: string): Promise<Appointment> {
    if (!appointmentId?.trim()) throw new Error('Termin-ID ist erforderlich');
    return apiClient.get<Appointment>(`${APPOINTMENT_ENDPOINTS.GET_SINGLE}/${appointmentId}`);
  },

  /**
   * Create new appointment
   */
  async createAppointment(appointmentData: AppointmentRequest): Promise<Appointment> {
    if (!appointmentData.matchId) throw new Error('Match-ID ist erforderlich');
    if (!appointmentData.startTime) throw new Error('Startzeitpunkt ist erforderlich');
    if (!appointmentData.endTime) throw new Error('Endzeitpunkt ist erforderlich');
    return apiClient.post<Appointment>(APPOINTMENT_ENDPOINTS.CREATE, appointmentData);
  },

  /**
   * Accept appointment
   */
  async acceptAppointment(appointmentId: string): Promise<AppointmentResponse> {
    if (!appointmentId?.trim()) throw new Error('Termin-ID ist erforderlich');
    return apiClient.post<AppointmentResponse>(`${APPOINTMENT_ENDPOINTS.ACCEPT}/${appointmentId}/accept`, { AppointmentId: appointmentId });
  },

  /**
   * Cancel appointment
   */
  async cancelAppointment(appointmentId: string): Promise<AppointmentResponse> {
    if (!appointmentId?.trim()) throw new Error('Termin-ID ist erforderlich');
    return apiClient.post<AppointmentResponse>(`${APPOINTMENT_ENDPOINTS.CANCEL}/${appointmentId}/cancel`, { AppointmentId: appointmentId });
  },

  /**
   * Respond to appointment (accept/cancel) - kept for backward compatibility
   */
  async respondToAppointment(
    appointmentId: string,
    status: AppointmentStatus
  ): Promise<AppointmentResponse> {
    if (status === AppointmentStatus.Confirmed) {
      return this.acceptAppointment(appointmentId);
    } else {
      return this.cancelAppointment(appointmentId);
    }
  },

  /**
   * Complete appointment - Note: This endpoint may not exist in backend
   */
  async completeAppointment(appointmentId: string): Promise<AppointmentResponse> {
    if (!appointmentId?.trim()) throw new Error('Termin-ID ist erforderlich');
    // This endpoint doesn't exist in backend - would need to be implemented
    throw new Error('Complete appointment endpoint not implemented in backend');
  },

  /**
   * Get upcoming appointments (filtered version of getAppointments)
   */
  async getUpcomingAppointments(limit?: number): Promise<PagedUserAppointmentsResponse> {
    const now = new Date();
    const request: GetUserAppointmentsRequest = {
      FromDate: now,
      IncludePast: false,
      PageSize: limit || 20
    };
    return this.getAppointments(request);
  },

  /**
   * Get past appointments with pagination (filtered version of getAppointments)
   */
  async getPastAppointments(params?: { page?: number; limit?: number }): Promise<PagedUserAppointmentsResponse> {
    const now = new Date();
    const request: GetUserAppointmentsRequest = {
      ToDate: now,
      IncludePast: true,
      PageNumber: params?.page || 1,
      PageSize: params?.limit || 20
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
   * Reschedule appointment - Note: This endpoint may not exist in backend
   */
  async rescheduleAppointment(appointmentId: string, newDateTime: string, _?: string): Promise<Appointment> {
    if (!appointmentId?.trim()) throw new Error('Termin-ID ist erforderlich');
    if (!newDateTime?.trim()) throw new Error('Neuer Zeitpunkt ist erforderlich');
    // This endpoint doesn't exist in backend - would need to be implemented
    throw new Error('Reschedule appointment endpoint not implemented in backend');
  },

  /**
   * Rate completed appointment - Note: This endpoint may not exist in backend
   */
  async rateAppointment(appointmentId: string, rating: number, _?: string): Promise<Appointment> {
    if (!appointmentId?.trim()) throw new Error('Termin-ID ist erforderlich');
    if (rating < 1 || rating > 5) throw new Error('Bewertung muss zwischen 1 und 5 liegen');
    // This endpoint doesn't exist in backend - would need to be implemented
    throw new Error('Rate appointment endpoint not implemented in backend');
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
    // This endpoint doesn't exist in backend - would need to be implemented
    throw new Error('Appointment statistics endpoint not implemented in backend');
  },

  /**
   * Send appointment reminder - Note: This endpoint may not exist in backend
   */
  async sendAppointmentReminder(appointmentId: string): Promise<void> {
    if (!appointmentId?.trim()) throw new Error('Termin-ID ist erforderlich');
    // This endpoint doesn't exist in backend - would need to be implemented
    throw new Error('Send reminder endpoint not implemented in backend');
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
  async updateAvailabilityPreferences(_: any): Promise<any> {
    // This endpoint doesn't exist in backend - would need to be implemented
    throw new Error('Update availability preferences endpoint not implemented in backend');
  },
};

export default appointmentService;