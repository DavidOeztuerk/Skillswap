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
import { useAppointments } from '../../hooks/useAppointments';

/**
 * Seite zur Verwaltung der Termine des Benutzers
 */
const AppointmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    appointments,
    isLoading,
    error,
    acceptAppointment,
    declineAppointment,
    completeAppointment,
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

  // Termine laden
  useEffect(() => {
    // Beim Start immer den letzten Status löschen
    setStatusMessage(null);
  }, []);

  // Dialog-Handler
  const handleConfirmDialogOpen = (
    appointmentId: string,
    action: 'confirm' | 'cancel' | 'complete'
  ) => {
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

    try {
      let success = false;
      let messageText = '';

      switch (action) {
        case 'confirm':
          success = await acceptAppointment(appointmentId);
          messageText = 'Termin wurde erfolgreich bestätigt';
          break;
        case 'cancel':
          success = await declineAppointment(appointmentId);
          messageText = 'Termin wurde abgesagt';
          break;
        case 'complete':
          success = await completeAppointment(appointmentId);
          messageText = 'Termin wurde als abgeschlossen markiert';
          break;
      }

      if (success) {
        setStatusMessage({
          text: messageText,
          type: 'success',
        });
      } else {
        throw new Error('Fehler bei der Terminverwaltung');
      }
    } catch (error) {
      setStatusMessage({
        text: 'Fehler bei der Terminverwaltung' + ' ' + error,
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
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Termine' },
        ]}
        action={
          <PageHeaderAction
            label="Zum Matchmaking"
            onClick={() => navigate('/matchmaking')}
          />
        }
      />

      {statusMessage && (
        <AlertMessage
          severity={statusMessage.type}
          message={statusMessage.text}
          onClose={() => setStatusMessage(null)}
        />
      )}

      <Box mt={3}>
        <AppointmentList
          appointments={appointments}
          isLoading={isLoading}
          error={error}
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

export default AppointmentsPage;
