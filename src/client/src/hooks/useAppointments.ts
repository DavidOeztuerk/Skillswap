import { useCallback, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/store.hooks';
import { AppointmentFilter } from '../types/states/AppointmentsState';
import { 
  fetchAppointments,
  createAppointment,
  respondToAppointment,
  updateAppointmentStatusOptimistic,
  setAppointments,
  setUpcomingAppointments,
  setPastAppointments
} from '../features/appointments/appointmentsSlice';
import { AppointmentRequest } from '../types/contracts/requests/AppointmentRequest';
import { Appointment, AppointmentStatus } from '../types/models/Appointment';
import { withDefault } from '../utils/safeAccess';
import { withOptimisticUpdate, generateUpdateId, canPerformOptimisticUpdate } from '../utils/optimisticUpdates';

/**
 * Hook für die Verwaltung von Terminen
 * Bietet Funktionen zum Laden, Erstellen und Antworten auf Termine
 */
export const useAppointments = () => {
  const dispatch = useAppDispatch();
  const { appointments, upcomingAppointments, pastAppointments, isLoading, error } = useAppSelector(
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
    // Direkt dispatch aufrufen statt über die Funktion
    void dispatch(fetchAppointments());
  }, [dispatch]); // Nur dispatch als Dependency

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
    const safeAppointments = appointments;
    
    return safeAppointments.filter((appointment) => {
      if (!appointment) return false;
      
      if (filter.status && appointment.status !== filter.status) {
        return false;
      }

      if (
        filter.fromDate &&
        appointment.startTime &&
        new Date(appointment.startTime) < new Date(filter.fromDate)
      ) {
        return false;
      }

      if (
        filter.toDate &&
        appointment.startTime &&
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
   * Akzeptiert einen Termin mit optimistischem Update
   * @param appointmentId - ID des Termins
   * @returns true bei Erfolg, false bei Fehler
   */
  const acceptAppointment = async (appointmentId: string): Promise<boolean> => {
    if (!canPerformOptimisticUpdate()) {
      return respondToAppointmentRequest(appointmentId, AppointmentStatus.Confirmed);
    }

    const updateId = generateUpdateId('accept_appointment');
    const currentAppointments = [...appointments];
    const currentUpcoming = [...upcomingAppointments];
    const currentPast = [...pastAppointments];
    
    const result = await withOptimisticUpdate(
      updateId,
      // Optimistic action
      () => dispatch(updateAppointmentStatusOptimistic({ 
        appointmentId, 
        status: AppointmentStatus.Confirmed 
      })),
      // Async action
      async () => {
        const success = await respondToAppointmentRequest(
          appointmentId,
          AppointmentStatus.Confirmed
        );
        if (!success) {
          throw new Error('Failed to accept appointment');
        }
        return success;
      },
      // Rollback action
      () => {
        dispatch(setAppointments(currentAppointments));
        dispatch(setUpcomingAppointments(currentUpcoming));
        dispatch(setPastAppointments(currentPast));
      },
      // Options
      {
        showSuccess: true,
        successMessage: 'Appointment confirmed',
        errorMessage: 'Failed to confirm appointment',
      }
    );
    
    return result !== null;
  };

  /**
   * Lehnt einen Termin ab mit optimistischem Update
   * @param appointmentId - ID des Termins
   * @returns true bei Erfolg, false bei Fehler
   */
  const declineAppointment = async (
    appointmentId: string
  ): Promise<boolean> => {
    if (!canPerformOptimisticUpdate()) {
      return respondToAppointmentRequest(appointmentId, AppointmentStatus.Cancelled);
    }

    const updateId = generateUpdateId('decline_appointment');
    const currentAppointments = [...appointments];
    const currentUpcoming = [...upcomingAppointments];
    const currentPast = [...pastAppointments];
    
    const result = await withOptimisticUpdate(
      updateId,
      // Optimistic action
      () => dispatch(updateAppointmentStatusOptimistic({ 
        appointmentId, 
        status: AppointmentStatus.Cancelled 
      })),
      // Async action
      async () => {
        const success = await respondToAppointmentRequest(
          appointmentId,
          AppointmentStatus.Cancelled
        );
        if (!success) {
          throw new Error('Failed to decline appointment');
        }
        return success;
      },
      // Rollback action
      () => {
        dispatch(setAppointments(currentAppointments));
        dispatch(setUpcomingAppointments(currentUpcoming));
        dispatch(setPastAppointments(currentPast));
      },
      // Options
      {
        showSuccess: true,
        successMessage: 'Appointment cancelled',
        errorMessage: 'Failed to cancel appointment',
      }
    );
    
    return result !== null;
  };

  /**
   * Markiert einen Termin als abgeschlossen mit optimistischem Update
   * @param appointmentId - ID des Termins
   * @returns true bei Erfolg, false bei Fehler
   */
  const completeAppointment = async (
    appointmentId: string
  ): Promise<boolean> => {
    if (!canPerformOptimisticUpdate()) {
      return respondToAppointmentRequest(appointmentId, AppointmentStatus.Completed);
    }

    const updateId = generateUpdateId('complete_appointment');
    const currentAppointments = [...appointments];
    const currentUpcoming = [...upcomingAppointments];
    const currentPast = [...pastAppointments];
    
    const result = await withOptimisticUpdate(
      updateId,
      // Optimistic action
      () => dispatch(updateAppointmentStatusOptimistic({ 
        appointmentId, 
        status: AppointmentStatus.Completed 
      })),
      // Async action
      async () => {
        const success = await respondToAppointmentRequest(
          appointmentId,
          AppointmentStatus.Completed
        );
        if (!success) {
          throw new Error('Failed to complete appointment');
        }
        return success;
      },
      // Rollback action
      () => {
        dispatch(setAppointments(currentAppointments));
        dispatch(setUpcomingAppointments(currentUpcoming));
        dispatch(setPastAppointments(currentPast));
      },
      // Options
      {
        showSuccess: true,
        successMessage: 'Appointment completed',
        errorMessage: 'Failed to complete appointment',
      }
    );
    
    return result !== null;
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
    appointments: appointments,
    filteredAppointments: getFilteredAppointments(),
    isLoading: withDefault(isLoading, false),
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
