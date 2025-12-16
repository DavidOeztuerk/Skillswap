import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { Permissions } from '../../components/auth/permissions.constants';
import PageHeader, { PageHeaderAction } from '../../components/layout/PageHeader';
import PageContainer from '../../components/layout/PageContainer';
import AppointmentList from '../../components/appointments/AppointmentList';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import AlertMessage from '../../components/ui/AlertMessage';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { useAppointments } from '../../hooks/useAppointments';
import AppointmentErrorBoundary from '../../components/error/AppointmentErrorBoundary';
import errorService from '../../services/errorService';
import { AppointmentStatus } from '../../types/models/Appointment';
import { usePermissions } from '../../contexts/permissionContextHook';

/**
 * Seite zur Verwaltung der Termine des Benutzers
 */
const AppointmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  // Memoize permission checks for own appointments
  const canCancelOwnAppointment = useMemo(
    () => hasPermission(Permissions.Appointments.CANCEL_OWN),
    [hasPermission]
  );

  const {
    appointments,
    isLoading: appointmentsLoading,
    error,
    respondToAppointment,
    completeAppointment,
    loadAppointments,
  } = useAppointments();

  // Dialog-States
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    appointmentId?: string;
    action: 'confirm' | 'cancel' | 'complete';
  }>({
    open: false,
    title: '',
    message: '',
    action: 'confirm',
  });

  // Status-Meldung
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Seite initialisieren (einmal beim Mount)
  useEffect(() => {
    errorService.addBreadcrumb('Loading appointments page', 'navigation');
    // Beim Start immer den letzten Status löschen
    setStatusMessage(null);

    console.debug('🎯 AppointmentsPage: Loading appointments...');
    loadAppointments({ pageNumber: 1, pageSize: 12, includePast: true });
  }, [loadAppointments]);

  // Dialog-Handler
  const handleConfirmDialogOpen = (
    appointmentId: string,
    action: 'confirm' | 'cancel' | 'complete'
  ): void => {
    errorService.addBreadcrumb('Opening appointment action dialog', 'ui', {
      appointmentId,
      action,
    });

    let title = '';
    let message = '';

    switch (action) {
      case 'confirm':
        title = 'Termin bestätigen';
        message = 'Möchtest du diesen Termin wirklich bestätigen?';
        break;
      case 'cancel':
        title = 'Termin absagen';
        message = 'Möchtest du diesen Termin wirklich absagen?';
        break;
      case 'complete':
        title = 'Termin abschließen';
        message = 'Möchtest du diesen Termin als abgeschlossen markieren?';
        break;
      default:
        return;
    }

    setConfirmDialog({
      open: true,
      title,
      message,
      appointmentId,
      action,
    });
  };

  const handleConfirmDialogClose = (): void => {
    setConfirmDialog({
      ...confirmDialog,
      open: false,
    });
  };

  // Aktions-Handler (fire-and-forget pattern)
  const handleConfirmAction = (): void => {
    const { appointmentId, action } = confirmDialog;

    if (!appointmentId) return;

    try {
      errorService.addBreadcrumb('Performing appointment action', 'action', {
        appointmentId,
        action,
      });

      let messageText = '';

      switch (action) {
        case 'confirm':
          respondToAppointment(appointmentId, AppointmentStatus.Confirmed);
          messageText = 'Termin wurde erfolgreich bestätigt';
          break;
        case 'cancel':
          respondToAppointment(appointmentId, AppointmentStatus.Cancelled);
          messageText = 'Termin wurde abgesagt';
          break;
        case 'complete':
          completeAppointment(appointmentId);
          messageText = 'Termin wurde als abgeschlossen markiert';
          break;
        default:
          return;
      }

      errorService.addBreadcrumb('Appointment action dispatched', 'action', {
        appointmentId,
        action,
      });
      setStatusMessage({
        text: messageText,
        type: 'success',
      });
    } catch (actionError: unknown) {
      const errorMessage = actionError instanceof Error ? actionError.message : 'Unknown error';
      errorService.addBreadcrumb('Error performing appointment action', 'error', {
        appointmentId,
        action,
        error: errorMessage,
      });
      setStatusMessage({
        text: `Fehler bei der Terminverwaltung: ${errorMessage}`,
        type: 'error',
      });
    } finally {
      handleConfirmDialogClose();
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Meine Termine"
        subtitle="Verwalte deine Lehr- und Lerntermine"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Termine' }]}
        actions={
          <>
            <PageHeaderAction
              label="Kalenderansicht"
              onClick={() => {
                errorService.addBreadcrumb(
                  'Navigating to calendar from appointments',
                  'navigation'
                );
                void navigate('/appointments/calendar');
              }}
            />
            <PageHeaderAction
              label="Zum Matchmaking"
              onClick={() => {
                errorService.addBreadcrumb(
                  'Navigating to matchmaking from appointments',
                  'navigation'
                );
                void navigate('/matchmaking');
              }}
            />
          </>
        }
      />

      {statusMessage && (
        <AlertMessage
          severity={statusMessage.type}
          message={[statusMessage.text]}
          onClose={() => {
            setStatusMessage(null);
          }}
        />
      )}

      <Box mt={3}>
        {appointmentsLoading && appointments.length === 0 ? (
          <SkeletonLoader variant="list" count={5} />
        ) : (
          <AppointmentList
            appointments={appointments}
            isLoading={appointmentsLoading}
            error={error}
            onConfirm={(appointmentId) => {
              handleConfirmDialogOpen(appointmentId, 'confirm');
            }}
            onCancel={
              canCancelOwnAppointment
                ? (appointmentId) => {
                    handleConfirmDialogOpen(appointmentId, 'cancel');
                  }
                : undefined
            }
            onComplete={(appointmentId) => {
              handleConfirmDialogOpen(appointmentId, 'complete');
            }}
          />
        )}
      </Box>

      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={handleConfirmAction}
        onCancel={handleConfirmDialogClose}
      />
    </PageContainer>
  );
};

const WrappedAppointmentsPage: React.FC = () => (
  <AppointmentErrorBoundary>
    <AppointmentsPage />
  </AppointmentErrorBoundary>
);

export default WrappedAppointmentsPage;
