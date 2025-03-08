// src/hooks/useAppointments.ts
import { useCallback, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store.hooks';
import { AppointmentFilter } from '../types/states/AppointmentsState';
import {
  createAppointment,
  fetchAppointments,
  respondToAppointment,
} from '../features/appointments/appointmentsSlice';
import { AppointmentRequest } from '../types/contracts/requests/AppointmentRequest';
import { Appointment, AppointmentStatus } from '../types/models/Appointment';

/**
 * Hook für die Verwaltung von Terminen
 * Bietet Funktionen zum Laden, Erstellen und Antworten auf Termine
 */
export const useAppointments = () => {
  const dispatch = useAppDispatch();
  const { appointments, isLoading, error } = useAppSelector(
    (state) => state.appointments
  );
  const [filter, setFilter] = useState<AppointmentFilter>({
    status: undefined,
    fromDate: undefined,
    toDate: undefined,
    role: undefined,
  });

  /**
   * Lädt alle Termine für den aktuellen Benutzer
   */
  const loadAppointments = useCallback(async (): Promise<void> => {
    await dispatch(fetchAppointments());
  }, [dispatch]);

  // Lade Termine beim ersten Rendern
  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  /**
   * Erstellt einen neuen Termin
   * @param appointmentData - Daten für den neuen Termin
   * @returns Die erstellte Termindaten oder null bei Fehler
   */
  const scheduleAppointment = async (
    appointmentData: AppointmentRequest
  ): Promise<Appointment | null> => {
    const resultAction = await dispatch(createAppointment(appointmentData));

    if (createAppointment.fulfilled.match(resultAction)) {
      return resultAction.payload;
    }

    return null;
  };

  /**
   * Antwortet auf eine Terminanfrage (annehmen oder ablehnen)
   * @param appointmentId - ID des Termins
   * @param status - Neuer Status (confirmed/cancelled)
   * @returns true bei Erfolg, false bei Fehler
   */
  const respondToAppointmentRequest = async (
    appointmentId: string,
    status: AppointmentStatus
  ): Promise<boolean> => {
    const resultAction = await dispatch(
      respondToAppointment({ appointmentId, status })
    );

    return respondToAppointment.fulfilled.match(resultAction);
  };

  const userId = useAppSelector((state) => state.auth.user?.id);

  /**
   * Filtert die Termine basierend auf dem aktuellen Filter
   * @returns Gefilterte Termine
   */
  const getFilteredAppointments = (): Appointment[] => {
    return appointments.filter((appointment) => {
      if (filter.status && appointment.status !== filter.status) {
        return false;
      }

      if (
        filter.fromDate &&
        new Date(appointment.startTime) < new Date(filter.fromDate)
      ) {
        return false;
      }

      if (
        filter.toDate &&
        new Date(appointment.startTime) > new Date(filter.toDate)
      ) {
        return false;
      }

      if (filter.role === 'teacher' && appointment.teacherId !== userId) {
        return false;
      }

      if (filter.role === 'student' && appointment.studentId !== userId) {
        return false;
      }

      return true;
    });
  };

  /**
   * Akzeptiert einen Termin
   * @param appointmentId - ID des Termins
   * @returns true bei Erfolg, false bei Fehler
   */
  const acceptAppointment = async (appointmentId: string): Promise<boolean> => {
    return respondToAppointmentRequest(
      appointmentId,
      AppointmentStatus.Confirmed
    );
  };

  /**
   * Lehnt einen Termin ab
   * @param appointmentId - ID des Termins
   * @returns true bei Erfolg, false bei Fehler
   */
  const declineAppointment = async (
    appointmentId: string
  ): Promise<boolean> => {
    return respondToAppointmentRequest(
      appointmentId,
      AppointmentStatus.Cancelled
    );
  };

  /**
   * Markiert einen Termin als abgeschlossen
   * @param appointmentId - ID des Termins
   * @returns true bei Erfolg, false bei Fehler
   */
  const completeAppointment = async (
    appointmentId: string
  ): Promise<boolean> => {
    return respondToAppointmentRequest(
      appointmentId,
      AppointmentStatus.Completed
    );
  };

  /**
   * Aktualisiert den Filter
   * @param newFilter - Neuer Filterwert oder Teilobjekt
   */
  const updateFilter = (newFilter: Partial<AppointmentFilter>): void => {
    setFilter((prev) => ({ ...prev, ...newFilter }));
  };

  return {
    // Daten
    appointments,
    filteredAppointments: getFilteredAppointments(),
    isLoading,
    error,
    filter,

    // Aktionen
    loadAppointments,
    scheduleAppointment,
    acceptAppointment,
    declineAppointment,
    completeAppointment,
    updateFilter,
  };
};
