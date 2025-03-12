// src/pages/matchmaking/MatchmakingPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';

import PageHeader from '../../components/layout/PageHeader';
import PageContainer from '../../components/layout/PageContainer';
import MatchList from '../../components/matchmaking/MatchList';
// import MatchForm from '../../components/matchmaking/MatchForm';
import AppointmentForm from '../../components/appointments/AppointmentForm';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import AlertMessage from '../../components/ui/AlertMessage';
import { useMatchmaking } from '../../hooks/useMatchmaking';
// import { useSkills } from '../../hooks/useSkills';
import { useAppointments } from '../../hooks/useAppointments';
import { Match } from '../../types/models/Match';
import { AppointmentRequest } from '../../types/contracts/requests/AppointmentRequest';
// import { MatchRequest } from '../../types/contracts/requests/MatchRequest';
// import { Skill } from '../../types/models/Skill';

/**
 * Seite für das Matchmaking zwischen Lehrern und Schülern
 */
const MatchmakingPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    matches,
    isLoading,
    error,
    loadMatches,
    // searchMatches,
    approveMatch,
    declineMatch,
  } = useMatchmaking();

  // const { userSkills, loadUserSkills } = useSkills();
  const { scheduleAppointment } = useAppointments();

  // State für Dialoge
  // const [matchFormOpen, setMatchFormOpen] = useState(false);
  // const [selectedUserSkill, setSelectedUserSkill] = useState<Skill | null>(
  //   null
  // );
  const [appointmentFormOpen, setAppointmentFormOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // State für Bestätigungsdialog
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    matchId?: string;
    action: 'accept' | 'reject';
  }>({
    open: false,
    title: '',
    message: '',
    action: 'accept',
  });

  // Status-Meldung
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Daten laden
  useEffect(() => {
    loadMatches();
    // loadUserSkills();
  }, [loadMatches]);

  // Handler für das Öffnen des Match-Formulars
  // const handleOpenMatchForm = (userSkill: Skill) => {
  //   setSelectedUserSkill(userSkill);
  //   setMatchFormOpen(true);
  // };

  // // Handler für das Schließen des Match-Formulars
  // const handleCloseMatchForm = () => {
  //   setMatchFormOpen(false);
  //   setSelectedUserSkill(null);
  // };

  // Handler für das Absenden des Match-Formulars
  // const handleSubmitMatchForm = async (data: MatchRequest) => {
  //   try {
  //     const success = await searchMatches(data);

  //     if (success) {
  //       setStatusMessage({
  //         text: 'Match-Anfrage erfolgreich gesendet',
  //         type: 'success',
  //       });
  //       handleCloseMatchForm();
  //     } else {
  //       throw new Error('Fehler beim Erstellen der Match-Anfrage');
  //     }
  //   } catch (error) {
  //     setStatusMessage({
  //       text: 'Fehler beim Erstellen der Match-Anfrage' + '' + error,
  //       type: 'error',
  //     });
  //   }
  // };

  // Handler für das Öffnen des Bestätigungsdialogs
  const handleConfirmDialogOpen = (
    matchId: string,
    action: 'accept' | 'reject'
  ) => {
    let title = '';
    let message = '';

    if (action === 'accept') {
      title = 'Match akzeptieren';
      message = 'Möchtest du dieses Match akzeptieren?';
    } else {
      title = 'Match ablehnen';
      message = 'Möchtest du dieses Match ablehnen?';
    }

    setConfirmDialog({
      open: true,
      title,
      message,
      matchId,
      action,
    });
  };

  // Handler für das Schließen des Bestätigungsdialogs
  const handleConfirmDialogClose = () => {
    setConfirmDialog({
      ...confirmDialog,
      open: false,
    });
  };

  // Handler für das Bestätigen der Aktion im Dialog
  const handleConfirmAction = async () => {
    const { matchId, action } = confirmDialog;

    if (!matchId) return;

    try {
      let success = false;

      if (action === 'accept') {
        const match = await approveMatch(matchId);
        success = !!match;
        setStatusMessage({
          text: 'Match erfolgreich akzeptiert',
          type: 'success',
        });
      } else {
        const match = await declineMatch(matchId);
        success = !!match;
        setStatusMessage({
          text: 'Match abgelehnt',
          type: 'success',
        });
      }

      if (!success) {
        throw new Error('Fehler bei der Match-Verwaltung');
      }
    } catch (error) {
      setStatusMessage({
        text: 'Fehler bei der Match-Verwaltung' + '' + error,
        type: 'error',
      });
    } finally {
      handleConfirmDialogClose();
    }
  };

  // Handler für das Öffnen des Termin-Formulars
  const handleOpenAppointmentForm = (match: Match) => {
    setSelectedMatch(match);
    setAppointmentFormOpen(true);
  };

  // Handler für das Schließen des Termin-Formulars
  const handleCloseAppointmentForm = () => {
    setAppointmentFormOpen(false);
    setSelectedMatch(null);
  };

  // Handler für das Absenden des Termin-Formulars
  const handleSubmitAppointmentForm = async (data: AppointmentRequest) => {
    try {
      const appointment = await scheduleAppointment(data);

      if (appointment) {
        setStatusMessage({
          text: 'Termin erfolgreich erstellt',
          type: 'success',
        });
        handleCloseAppointmentForm();

        // Zu den Terminen navigieren
        navigate('/appointments');
      } else {
        throw new Error('Fehler beim Erstellen des Termins');
      }
    } catch (error) {
      setStatusMessage({
        text: 'Fehler beim Erstellen des Termins' + '' + error,
        type: 'error',
      });
    }
  };

  // Lehrbare oder lernbare Skills des Benutzers finden
  const renderMatchButton = () => {
    // Skills, die der Benutzer lehren oder lernen kann
    // const teachableSkills = userSkills.filter((skill) => skill.isTeachable);
    // const learnableSkills = userSkills.filter((skill) => skill.isLearnable);

    // Wenn Benutzer sowohl lehrbare als auch lernbare Skills hat, zeige beide Optionen
    // if (teachableSkills.length > 0 && learnableSkills.length > 0) {
    //   return {
    //     label: 'Match erstellen',
    //     onClick: () => {
    //       // Hier könnte ein Dialog angezeigt werden, um zu fragen, ob der Benutzer lehren oder lernen möchte
    //       // Für dieses Beispiel nehmen wir einfach den ersten lehrbaren Skill
    //       handleOpenMatchForm(teachableSkills[0]);
    //     },
    //   };
    // }

    // Wenn Benutzer nur lehrbare Skills hat
    // if (teachableSkills.length > 0) {
    //   return {
    //     label: 'Als Lehrer:in anbieten',
    //     onClick: () => handleOpenMatchForm(teachableSkills[0]),
    //   };
    // }

    // // Wenn Benutzer nur lernbare Skills hat
    // if (learnableSkills.length > 0) {
    //   return {
    //     label: 'Lehrer:in finden',
    //     onClick: () => handleOpenMatchForm(learnableSkills[0]),
    //   };
    // }

    // Wenn Benutzer keine Skills hat, zeige einen Link zur Skills-Seite
    return {
      label: 'Skills hinzufügen',
      onClick: () => navigate('/skills'),
    };
  };

  const matchButtonInfo = renderMatchButton();

  return (
    <PageContainer>
      <PageHeader
        title="Matchmaking"
        subtitle="Finde passende Lehrer oder Schüler für deine Skills"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Matchmaking' },
        ]}
        action={
          <button onClick={matchButtonInfo.onClick}>
            {matchButtonInfo.label}
          </button>
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
        <MatchList
          matches={matches}
          isLoading={isLoading}
          error={error}
          onAccept={(matchId) => handleConfirmDialogOpen(matchId, 'accept')}
          onReject={(matchId) => handleConfirmDialogOpen(matchId, 'reject')}
          onSchedule={handleOpenAppointmentForm}
        />
      </Box>

      {/* Match-Formular */}
      {/* {selectedUserSkill && (
        <MatchForm
          open={matchFormOpen}
          onClose={handleCloseMatchForm}
          onSubmit={handleSubmitMatchForm}
          userSkill={selectedUserSkill}
          isLoading={isLoading}
        />
      )} */}

      {/* Termin-Formular */}
      {selectedMatch && (
        <AppointmentForm
          open={appointmentFormOpen}
          onClose={handleCloseAppointmentForm}
          onSubmit={handleSubmitAppointmentForm}
          match={selectedMatch}
          isLoading={isLoading}
        />
      )}

      {/* Bestätigungsdialog */}
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

export default MatchmakingPage;
