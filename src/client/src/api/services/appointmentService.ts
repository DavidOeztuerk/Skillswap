// src/api/services/appointmentService.ts
import { APPOINTMENT_ENDPOINTS } from '../../config/endpoints';
// import { ApiResponse } from '../../types/common/ApiResponse';
import { Appointment, AppointmentStatus } from '../../types/models/Appointment';
import { AppointmentRequest } from '../../types/contracts/requests/AppointmentRequest';
import { AppointmentResponse } from '../../types/contracts/responses/AppointmentResponse';
import apiClient from '../apiClient';

/**
 * Service für Termin-Operationen
 */
const appointmentService = {
  /**
   * Holt alle Termine des Benutzers
   * @returns Liste der Termine
   */
  getAppointments: async (): Promise<Appointment[]> => {
    const response = await apiClient.get<Appointment[]>(
      APPOINTMENT_ENDPOINTS.GET_MY
    );
    return response.data;
  },

  /**
   * Holt einen einzelnen Termin anhand seiner ID
   * @param appointmentId - ID des Termins
   * @returns Der angeforderte Termin
   */
  getAppointment: async (appointmentId: string): Promise<Appointment> => {
    const response = await apiClient.get<Appointment>(
      `${APPOINTMENT_ENDPOINTS.GET_SINGLE}/${appointmentId}`
    );
    return response.data;
  },

  /**
   * Erstellt einen neuen Termin
   * @param appointmentData - Daten für den neuen Termin
   * @returns Der erstellte Termin
   */
  createAppointment: async (
    appointmentData: AppointmentRequest
  ): Promise<Appointment> => {
    const response = await apiClient.post<Appointment>(
      APPOINTMENT_ENDPOINTS.CREATE,
      appointmentData
    );
    return response.data;
  },

  /**
   * Reagiert auf eine Terminanfrage (akzeptieren/ablehnen)
   * @param appointmentId - ID des Termins
   * @param status - Neuer Status (confirmed/cancelled)
   * @returns Antwort mit ID und Status
   */
  respondToAppointment: async (
    appointmentId: string,
    status: AppointmentStatus
  ): Promise<AppointmentResponse> => {
    const endpoint =
      status === AppointmentStatus.Confirmed
        ? `${APPOINTMENT_ENDPOINTS.ACCEPT}/${appointmentId}/accept`
        : `${APPOINTMENT_ENDPOINTS.CANCEL}/${appointmentId}/cancel`;
    const response = await apiClient.post<AppointmentResponse>(endpoint);
    return response.data;
  },

  /**
   * Sagt einen Termin ab
   * @param appointmentId - ID des abzusagenden Termins
   * @returns Antwort mit ID und Status
   */
  cancelAppointment: async (
    appointmentId: string
  ): Promise<AppointmentResponse> => {
    const response = await apiClient.post<AppointmentResponse>(
      `${APPOINTMENT_ENDPOINTS.CANCEL}/${appointmentId}/cancel`
    );
    return response.data;
  },

  /**
   * Markiert einen Termin als abgeschlossen
   * @param appointmentId - ID des abzuschließenden Termins
   * @returns Antwort mit ID und Status
   */
  completeAppointment: async (
    appointmentId: string
  ): Promise<AppointmentResponse> => {
    const response = await apiClient.post<AppointmentResponse>(
      `${APPOINTMENT_ENDPOINTS.CANCEL}/${appointmentId}/complete`
    );
    return response.data;
  },
};

export default appointmentService;
