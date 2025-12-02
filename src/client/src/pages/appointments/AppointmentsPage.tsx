// src/pages/appointments/AppointmentsPage.tsx      
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import PageHeader, {
  PageHeaderAction,
} from '../../components/layout/PageHeader';
import PageContainer from '../../components/layout/PageContainer';
import AppointmentList from '../../components/appointments/AppointmentList';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import AlertMessage from '../../components/ui/AlertMessage';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { useAppointments } from '../../hooks/useAppointments';
import { useLoading } from '../../contexts/LoadingContext';
import AppointmentErrorBoundary from '../../components/error/AppointmentErrorBoundary';
import errorService from '../../services/errorService';

/**
 * Seite zur Verwaltung der Termine des Benutzers
 */
const AppointmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { withLoading } = useLoading();
  const {
    appointments,
    isLoading: appointmentsLoading,
    errorMessage,
    acceptAppointment,
    declineAppointment,
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

    console.log('🎯 AppointmentsPage: Loading appointments...');
    loadAppointments({ pageNumber: 1, pageSize: 12, includePast: true });
  }, []); // Leere deps - läuft nur beim Mount

  // Dialog-Handler
  const handleConfirmDialogOpen = (
    appointmentId: string,
    action: 'confirm' | 'cancel' | 'complete'
  ) => {
    errorService.addBreadcrumb('Opening appointment action dialog', 'ui', { appointmentId, action });
    
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
    }

    setConfirmDialog({
      open: true,
      title,
      message,
      appointmentId,
      action,
    });
  };

  const handleConfirmDialogClose = () => {
    setConfirmDialog({
      ...confirmDialog,
      open: false,
    });
  };

  // Aktions-Handler
  const handleConfirmAction = async () => {
    const { appointmentId, action } = confirmDialog;

    if (!appointmentId) return;

    const loadingKey = `appointment.${action}`;
    
    await withLoading(loadingKey, async () => {
      try {
        errorService.addBreadcrumb('Performing appointment action', 'action', { appointmentId, action });

        let success = false;
        let result: { meta: { requestStatus: string } };
        let messageText = '';

        switch (action) {
          case 'confirm':
            result = await acceptAppointment(appointmentId);
            success = result.meta.requestStatus === 'fulfilled';
            messageText = 'Termin wurde erfolgreich bestätigt';
            break;
          case 'cancel':
            result = await declineAppointment(appointmentId);
            success = result.meta.requestStatus === 'fulfilled';
            messageText = 'Termin wurde abgesagt';
            break;
          case 'complete':
            result = await completeAppointment(appointmentId);
            success = result.meta.requestStatus === 'fulfilled';
            messageText = 'Termin wurde als abgeschlossen markiert';
            break;
        }

        if (success) {
          errorService.addBreadcrumb('Appointment action completed successfully', 'action', { appointmentId, action });
          setStatusMessage({
            text: messageText,
            type: 'success',
          });
        } else {
          errorService.addBreadcrumb('Appointment action failed', 'error', { appointmentId, action });
          throw new Error('Fehler bei der Terminverwaltung');
        }
      } catch (error) {
        errorService.addBreadcrumb('Error performing appointment action', 'error', { 
          appointmentId, 
          action, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        setStatusMessage({
          text: 'Fehler bei der Terminverwaltung' + ' ' + error,
          type: 'error',
        });
      } finally {
        handleConfirmDialogClose();
      }
    });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Meine Termine"
        subtitle="Verwalte deine Lehr- und Lerntermine"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Termine' },
        ]}
        actions={
          <>
            <PageHeaderAction
              label="Kalenderansicht"
              onClick={() => {
                errorService.addBreadcrumb('Navigating to calendar from appointments', 'navigation');
                navigate('/appointments/calendar');
              }}
            />
            <PageHeaderAction
              label="Zum Matchmaking"
              onClick={() => {
                errorService.addBreadcrumb('Navigating to matchmaking from appointments', 'navigation');
                navigate('/matchmaking');
              }}
            />
          </>
        }
      />

      {statusMessage && (
        <AlertMessage
          severity={statusMessage.type}
          message={[statusMessage.text]}
          onClose={() => setStatusMessage(null)}
        />
      )}

      <Box mt={3}>
        {appointmentsLoading && (!appointments || appointments.length === 0) ? (
          <SkeletonLoader variant="list" count={5} />
        ) : (
          <AppointmentList
            appointments={appointments}
            isLoading={appointmentsLoading}
            error={errorMessage}
            onConfirm={(appointmentId) =>
              handleConfirmDialogOpen(appointmentId, 'confirm')
            }
            onCancel={(appointmentId) =>
              handleConfirmDialogOpen(appointmentId, 'cancel')
            }
            onComplete={(appointmentId) =>
              handleConfirmDialogOpen(appointmentId, 'complete')
            }
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