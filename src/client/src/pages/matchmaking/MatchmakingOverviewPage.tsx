// src/pages/matchmaking/MatchmakingOverviewPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Tabs,
  Tab,
  // Typography,
  Button,
  // Container,
  Paper,
  // Alert,
  Fab,
  Tooltip,
} from '@mui/material';
import {
  People as MatchesIcon,
  MailOutline as RequestsIcon,
  Add as AddIcon,
} from '@mui/icons-material';

import PageHeader from '../../components/layout/PageHeader';
import PageContainer from '../../components/layout/PageContainer';
import MatchList from '../../components/matchmaking/MatchList';
import MatchForm from '../../components/matchmaking/MatchForm';
import AppointmentForm from '../../components/appointments/AppointmentForm';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import AlertMessage from '../../components/ui/AlertMessage';
import { useMatchmaking } from '../../hooks/useMatchmaking';
import { useSkills } from '../../hooks/useSkills';
import { useAppointments } from '../../hooks/useAppointments';
import { Match } from '../../types/models/Match';
import { AppointmentRequest } from '../../types/contracts/requests/AppointmentRequest';
import { CreateMatchRequest } from '../../types/contracts/requests/CreateMatchRequest';
import { Skill } from '../../types/models/Skill';
import MatchRequestsOverviewPage from './MatchRequestsOverviewPage';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`matchmaking-tabpanel-${index}`}
      aria-labelledby={`matchmaking-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `matchmaking-tab-${index}`,
    'aria-controls': `matchmaking-tabpanel-${index}`,
  };
}

/**
 * Haupt-Seite für Matchmaking mit Tab-System
 * - Tab 1: Matches anzeigen
 * - Tab 2: Match-Requests verwalten
 */
const MatchmakingOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Tab-State wird nur intern verwaltet, nicht über URL
  const [tabValue, setTabValue] = useState(0);
  
  const {
    matches,
    isLoading,
    error,
    loadMatches,
    // sendMatchRequest, // ❌ ENTFERNT: Wird nicht verwendet da allgemeine Match-Anfragen deaktiviert sind
    approveMatch,
    declineMatch,
  } = useMatchmaking();

  const { userSkills, fetchUserSkills } = useSkills();
  const { scheduleAppointment } = useAppointments();

  // State für Dialoge
  const [matchFormOpen, setMatchFormOpen] = useState(false);
  const [selectedUserSkill, setSelectedUserSkill] = useState<Skill | null>(null);
  const [appointmentFormOpen, setAppointmentFormOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // State für Bestätigungsdialog
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    matchId: string | null;
    action: 'accept' | 'reject' | null;
  }>({
    open: false,
    title: '',
    message: '',
    matchId: null,
    action: null,
  });

  // Status-Meldung
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Daten laden
  useEffect(() => {
    if (tabValue === 0) {
      void loadMatches();
    }
    void fetchUserSkills();
  }, [tabValue, loadMatches, fetchUserSkills]);

  // Tab-Handler - nur lokaler State, keine URL-Navigation
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handler für das Öffnen des Match-Formulars
  const handleOpenMatchForm = (userSkill: Skill) => {
    setSelectedUserSkill(userSkill);
    setMatchFormOpen(true);
  };

  // Handler für das Schließen des Match-Formulars
  const handleCloseMatchForm = () => {
    setMatchFormOpen(false);
    setSelectedUserSkill(null);
  };

  // ❌ DEAKTIVIERT: Allgemeine Match-Anfragen sind nicht implementiert
  // Das Backend benötigt eine spezifische TargetUserId
  // Match-Anfragen sollten nur von SkillDetailPage aus erstellt werden
  const handleSubmitMatchForm = async (_data: CreateMatchRequest) => {
    setStatusMessage({
      text: 'Diese Funktionalität ist noch nicht verfügbar. Bitte erstelle Match-Anfragen direkt von der Skill-Detail-Seite.',
      type: 'info',
    });
    handleCloseMatchForm();
  };

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
      let success: string | null = null;

      if (action === 'accept') {
        success = await approveMatch(matchId);
      } else if (action === 'reject') {
        success = await declineMatch(matchId);
      }

      if (success) {
        setStatusMessage({
          text: `Match erfolgreich ${action === 'accept' ? 'akzeptiert' : 'abgelehnt'}`,
          type: 'success',
        });
        void loadMatches(); // Reload matches
      } else {
        throw new Error(`Fehler beim ${action === 'accept' ? 'Akzeptieren' : 'Ablehnen'} des Matches`);
      }
    } catch (error) {
      setStatusMessage({
        text: `Fehler beim ${action === 'accept' ? 'Akzeptieren' : 'Ablehnen'} des Matches: ` + String(error),
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
      const success = await scheduleAppointment(data);

      if (success) {
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
    const teachableSkills = userSkills?.filter((skill) => skill.isOffered);
    const learnableSkills = userSkills?.filter((skill) => !skill.isOffered);

    // Wenn Benutzer sowohl lehrbare als auch lernbare Skills hat, zeige beide Optionen
    if (teachableSkills && learnableSkills && teachableSkills?.length > 0 && learnableSkills?.length > 0) {
      return {
        label: 'Match erstellen',
        onClick: () => {
          // Für dieses Beispiel nehmen wir einfach den ersten lehrbaren Skill
          handleOpenMatchForm(teachableSkills[0]);
        },
      };
    }

    // Wenn Benutzer nur lehrbare Skills hat
    if (teachableSkills && teachableSkills.length > 0) {
      return {
        label: 'Als Lehrer:in anbieten',
        onClick: () => handleOpenMatchForm(teachableSkills[0]),
      };
    }

    // Wenn Benutzer nur lernbare Skills hat
    if (learnableSkills && learnableSkills.length > 0) {
      return {
        label: 'Lehrer:in finden',
        onClick: () => handleOpenMatchForm(learnableSkills[0]),
      };
    }

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
        subtitle="Verwalte deine Matches und Match-Anfragen"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Matchmaking' },
        ]}
        actions={
          <Button
            variant="contained"
            onClick={matchButtonInfo.onClick}
            startIcon={<AddIcon />}
          >
            {matchButtonInfo.label}
          </Button>
        }
      />

      {statusMessage && (
        <AlertMessage
          severity={statusMessage.type}
          message={[statusMessage.text]}
          onClose={() => setStatusMessage(null)}
        />
      )}

      {/* Tab-Navigation */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="Matchmaking-Tabs"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTabs-indicator': {
              height: 3,
            },
          }}
        >
          <Tab
            icon={<MatchesIcon />}
            label="Matches"
            {...a11yProps(0)}
            sx={{
              minHeight: 64,
              textTransform: 'none',
              fontSize: '0.95rem',
              fontWeight: 500,
            }}
          />
          <Tab
            icon={<RequestsIcon />}
            label="Anfragen"
            {...a11yProps(1)}
            sx={{
              minHeight: 64,
              textTransform: 'none',
              fontSize: '0.95rem',
              fontWeight: 500,
            }}
          />
        </Tabs>
      </Paper>

      {/* Tab-Inhalte */}
      <TabPanel value={tabValue} index={0}>
        <MatchList
          matches={matches}
          isLoading={isLoading}
          error={error}
          onAccept={(matchId) => handleConfirmDialogOpen(matchId, 'accept')}
          onReject={(matchId) => handleConfirmDialogOpen(matchId, 'reject')}
          onSchedule={handleOpenAppointmentForm}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <MatchRequestsOverviewPage embedded={true} />
      </TabPanel>

      {/* Match-Formular */}
      {selectedUserSkill && (
        <MatchForm
          open={matchFormOpen}
          onClose={handleCloseMatchForm}
          onSubmit={handleSubmitMatchForm}
          skill={selectedUserSkill}
          targetUserId="placeholder" // ❌ DEAKTIVIERT: Allgemeine Match-Anfragen sind nicht verfügbar
          targetUserName="Unbekannt"
          isLoading={isLoading}
        />
      )}

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

      {/* Floating Action Button für schnelle Aktionen */}
      <Tooltip title={matchButtonInfo.label}>
        <Fab
          color="primary"
          aria-label="match erstellen"
          onClick={matchButtonInfo.onClick}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
          }}
        >
          <AddIcon />
        </Fab>
      </Tooltip>
    </PageContainer>
  );
};

export default MatchmakingOverviewPage;