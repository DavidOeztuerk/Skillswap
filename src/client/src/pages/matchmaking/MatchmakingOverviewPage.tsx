import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Tabs,
  Tab,
  Button,
  Paper,
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
import AppointmentForm from '../../components/appointments/AppointmentForm';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import AlertMessage from '../../components/ui/AlertMessage';
import { useMatchmaking } from '../../hooks/useMatchmaking';
import { useAppointments } from '../../hooks/useAppointments';
import { Match } from '../../types/models/Match';
import { AppointmentRequest } from '../../types/contracts/requests/AppointmentRequest';
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
  const [searchParams] = useSearchParams();
  const didInitialLoad = useRef(false);
  const lastTabValue = useRef<number | null>(null);
  
  // Tab-State basierend auf URL-Parameter
  const tabFromUrl = searchParams.get('tab');
  const initialTab = tabFromUrl === 'outgoing' ? 2 : tabFromUrl === 'incoming' ? 1 : 0;
  const [tabValue, setTabValue] = useState(initialTab);
  
  const {
    matches,
    isLoading,
    errorMessage,
    loadMatches,
    loadIncomingRequests,
    loadOutgoingRequests,
    approveMatch,
    declineMatch,
  } = useMatchmaking();

  const { scheduleAppointment } = useAppointments();
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

  // Initial data load based on tab
  useEffect(() => {
    if (didInitialLoad.current) {
      console.log('⏭️ [MatchmakingOverviewPage] Already did initial load, skipping');
      return;
    }
    didInitialLoad.current = true;
    
    console.log(`🚀 [MatchmakingOverviewPage] Initial load for tab ${tabValue}`);
    
    // Load data based on initial tab
    if (tabValue === 0) {
      void loadMatches();
    } else if (tabValue === 1) {
      void loadIncomingRequests();
    } else if (tabValue === 2) {
      void loadOutgoingRequests();
    }
  }, []);
  
  // Load data when tab changes
  useEffect(() => {
    // Skip if same tab
    if (lastTabValue.current === tabValue) {
      console.log('⏭️ [MatchmakingOverviewPage] Same tab, skipping reload');
      return;
    }
    lastTabValue.current = tabValue;
    
    console.log(`📥 [MatchmakingOverviewPage] Tab changed to ${tabValue}, loading data`);
    
    if (tabValue === 0) {
      void loadMatches();
    } else if (tabValue === 1) {
      void loadIncomingRequests();
    } else if (tabValue === 2) {
      void loadOutgoingRequests();
    }
  }, [tabValue, loadMatches, loadIncomingRequests, loadOutgoingRequests]);

  // Tab-Handler - nur lokaler State, keine URL-Navigation
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
      let success: boolean | null = null;

      if (action === 'accept') {
        const approved = await approveMatch(matchId);
        success = approved.meta.requestStatus === 'fulfilled';
      } else if (action === 'reject') {
        const rejected = await declineMatch(matchId);
        success = rejected.meta.requestStatus === 'fulfilled';
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
    // Navigiere zur Skills-Seite, um dort Skills zu finden und Match-Anfragen zu erstellen
    return {
      label: 'Skills durchsuchen',
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

      {/* Debug Panel - nur in Entwicklung */}
      {/* {import.meta.env.DEV && <MatchmakingDebugPanel />} */}

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
          errorMessage={errorMessage}
          onAccept={(matchId) => handleConfirmDialogOpen(matchId, 'accept')}
          onReject={(matchId) => handleConfirmDialogOpen(matchId, 'reject')}
          onSchedule={handleOpenAppointmentForm}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <MatchRequestsOverviewPage embedded={true} />
      </TabPanel>


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