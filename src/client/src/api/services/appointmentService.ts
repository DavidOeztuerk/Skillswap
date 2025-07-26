// src/api/services/appointmentService.ts
import { APPOINTMENT_ENDPOINTS } from '../../config/endpoints';
import { Appointment, AppointmentStatus } from '../../types/models/Appointment';
import { AppointmentRequest } from '../../types/contracts/requests/AppointmentRequest';
import { AppointmentResponse } from '../../types/contracts/responses/AppointmentResponse';
import apiClient from '../apiClient';

/**
 * Service for appointment operations
 */
const appointmentService = {
  /**
   * Get all user appointments
   */
  async getAppointments(): Promise<Appointment[]> {
    return apiClient.get<Appointment[]>(APPOINTMENT_ENDPOINTS.GET_MY);
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
   * Respond to appointment (accept/cancel)
   */
  async respondToAppointment(
    appointmentId: string,
    status: AppointmentStatus
  ): Promise<AppointmentResponse> {
    if (!appointmentId?.trim()) throw new Error('Termin-ID ist erforderlich');
    
    const endpoint = status === AppointmentStatus.Confirmed
      ? `${APPOINTMENT_ENDPOINTS.ACCEPT}/${appointmentId}/accept`
      : `${APPOINTMENT_ENDPOINTS.CANCEL}/${appointmentId}/cancel`;
    
    return apiClient.post<AppointmentResponse>(endpoint);
  },

  /**
   * Cancel appointment
   */
  async cancelAppointment(appointmentId: string): Promise<AppointmentResponse> {
    return this.respondToAppointment(appointmentId, AppointmentStatus.Cancelled);
  },

  /**
   * Complete appointment
   */
  async completeAppointment(appointmentId: string): Promise<AppointmentResponse> {
    if (!appointmentId?.trim()) throw new Error('Termin-ID ist erforderlich');
    return apiClient.post<AppointmentResponse>(
      `${APPOINTMENT_ENDPOINTS.CANCEL}/${appointmentId}/complete`
    );
  },

  /**
   * Get upcoming appointments
   */
  async getUpcomingAppointments(limit?: number): Promise<Appointment[]> {
    const params = limit ? `?limit=${limit}` : '';
    return apiClient.get<Appointment[]>(`${APPOINTMENT_ENDPOINTS.GET_MY}/upcoming${params}`);
  },

  /**
   * Get past appointments with pagination
   */
  async getPastAppointments(params?: { page?: number; limit?: number }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const url = `${APPOINTMENT_ENDPOINTS.GET_MY}/past${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return apiClient.get<any>(url);
  },

  /**
   * Get available time slots for a user
   */
  async getAvailableSlots(userId: string, date: string): Promise<any[]> {
    if (!userId?.trim()) throw new Error('Benutzer-ID ist erforderlich');
    if (!date?.trim()) throw new Error('Datum ist erforderlich');
    return apiClient.get<any[]>(`${APPOINTMENT_ENDPOINTS.GET_MY}/available-slots?userId=${userId}&date=${date}`);
  },

  /**
   * Update appointment details
   */
  async updateAppointment(appointmentId: string, updates: Partial<Appointment>): Promise<Appointment> {
    if (!appointmentId?.trim()) throw new Error('Termin-ID ist erforderlich');
    return apiClient.put<Appointment>(`${APPOINTMENT_ENDPOINTS.GET_SINGLE}/${appointmentId}`, updates);
  },

  /**
   * Reschedule appointment
   */
  async rescheduleAppointment(appointmentId: string, newDateTime: string, reason?: string): Promise<Appointment> {
    if (!appointmentId?.trim()) throw new Error('Termin-ID ist erforderlich');
    if (!newDateTime?.trim()) throw new Error('Neuer Zeitpunkt ist erforderlich');
    return apiClient.post<Appointment>(`${APPOINTMENT_ENDPOINTS.GET_SINGLE}/${appointmentId}/reschedule`, {
      newDateTime,
      reason,
    });
  },

  /**
   * Rate completed appointment
   */
  async rateAppointment(appointmentId: string, rating: number, feedback?: string): Promise<Appointment> {
    if (!appointmentId?.trim()) throw new Error('Termin-ID ist erforderlich');
    if (rating < 1 || rating > 5) throw new Error('Bewertung muss zwischen 1 und 5 liegen');
    return apiClient.post<Appointment>(`${APPOINTMENT_ENDPOINTS.GET_SINGLE}/${appointmentId}/rate`, {
      rating,
      feedback,
    });
  },

  /**
   * Report problematic appointment
   */
  async reportAppointment(appointmentId: string, reason: string, description: string): Promise<void> {
    if (!appointmentId?.trim()) throw new Error('Termin-ID ist erforderlich');
    if (!reason?.trim()) throw new Error('Grund ist erforderlich');
    await apiClient.post(`${APPOINTMENT_ENDPOINTS.GET_SINGLE}/${appointmentId}/report`, {
      reason,
      description,
    });
  },

  /**
   * Get appointment statistics
   */
  async getAppointmentStatistics(timeRange?: string): Promise<any> {
    const params = timeRange ? `?timeRange=${timeRange}` : '';
    return apiClient.get<any>(`${APPOINTMENT_ENDPOINTS.GET_MY}/statistics${params}`);
  },

  /**
   * Send appointment reminder
   */
  async sendAppointmentReminder(appointmentId: string): Promise<void> {
    if (!appointmentId?.trim()) throw new Error('Termin-ID ist erforderlich');
    await apiClient.post(`${APPOINTMENT_ENDPOINTS.GET_SINGLE}/${appointmentId}/remind`);
  },

  /**
   * Get user availability preferences
   */
  async getAvailabilityPreferences(): Promise<any> {
    return apiClient.get<any>(`${APPOINTMENT_ENDPOINTS.GET_MY}/availability-preferences`);
  },

  /**
   * Update user availability preferences
   */
  async updateAvailabilityPreferences(preferences: any): Promise<any> {
    return apiClient.put<any>(`${APPOINTMENT_ENDPOINTS.GET_MY}/availability-preferences`, preferences);
  },
};

export default appointmentService;