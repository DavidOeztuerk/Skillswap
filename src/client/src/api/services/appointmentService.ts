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
};

export default appointmentService;