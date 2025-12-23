import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  People as MatchesIcon,
  MailOutline as RequestsIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { Box, Tabs, Tab, Button, Paper, Fab, Tooltip } from '@mui/material';
import PageContainer from '../../../shared/components/layout/PageContainer';
import PageHeader from '../../../shared/components/layout/PageHeader';
import AlertMessage from '../../../shared/components/ui/AlertMessage';
import ConfirmDialog from '../../../shared/components/ui/ConfirmDialog';
import useToast from '../../../shared/hooks/useToast';
import AppointmentForm from '../../appointments/components/AppointmentForm';
import { useAppointments } from '../../appointments/hooks/useAppointments';
import MatchList from '../components/MatchList';
import useMatchmaking from '../hooks/useMatchmaking';
import MatchRequestsOverviewPage from './MatchRequestsOverviewPage';
import type { TabPanelProps } from '../../../shared/types/components/LayoutProps';
import type { AppointmentRequest } from '../../appointments/types/AppointmentRequest';
import type { MatchDisplay } from '../types/MatchmakingDisplay';

const TabPanel = (props: TabPanelProps): React.ReactNode => {
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
};

function a11yProps(index: number): { id: string; 'aria-controls': string } {
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
  const toast = useToast();
  const didInitialLoad = useRef(false);
  const lastTabValue = useRef<number | null>(null);

  // Tab-State basierend auf URL-Parameter
  const tabFromUrl = searchParams.get('tab');
  const initialTab = tabFromUrl === 'outgoing' ? 2 : tabFromUrl === 'incoming' ? 1 : 0;
  const [tabValue, setTabValue] = useState(initialTab);

  // Initialize lastTabValue to prevent duplicate initial load
  lastTabValue.current ??= initialTab;

  const {
    matches,
    isLoading,
    error: errorMessage,
    loadMatches,
    loadIncomingRequests,
    loadOutgoingRequests,
    approveMatch,
    declineMatch,
  } = useMatchmaking();

  const { createAppointment: scheduleAppointment } = useAppointments();
  const [appointmentFormOpen, setAppointmentFormOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<MatchDisplay | null>(null);

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
      console.debug('⏭️ [MatchmakingOverviewPage] Already did initial load, skipping');
      return;
    }
    didInitialLoad.current = true;

    console.debug(`🚀 [MatchmakingOverviewPage] Initial load for tab ${tabValue}`);

    // Load data based on initial tab
    if (tabValue === 0) {
      loadMatches();
    } else if (tabValue === 1) {
      loadIncomingRequests();
    } else if (tabValue === 2) {
      loadOutgoingRequests();
    }
  }, [tabValue, loadMatches, loadIncomingRequests, loadOutgoingRequests]);

  // Load data when tab changes
  useEffect(() => {
    // Skip if this is the initial load (handled by the initial useEffect)
    if (!didInitialLoad.current) {
      console.debug(
        '⏭️ [MatchmakingOverviewPage] Initial load not complete, skipping tab change reload'
      );
      return;
    }

    // Skip if same tab
    if (lastTabValue.current === tabValue) {
      console.debug('⏭️ [MatchmakingOverviewPage] Same tab, skipping reload');
      return;
    }
    lastTabValue.current = tabValue;

    console.debug(`📥 [MatchmakingOverviewPage] Tab changed to ${tabValue}, loading data`);

    if (tabValue === 0) {
      loadMatches();
    } else if (tabValue === 1) {
      loadIncomingRequests();
    } else if (tabValue === 2) {
      loadOutgoingRequests();
    }
  }, [tabValue, loadMatches, loadIncomingRequests, loadOutgoingRequests]);

  // Tab-Handler - nur lokaler State, keine URL-Navigation
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number): void => {
    setTabValue(newValue);
  };

  // Handler für das Öffnen des Bestätigungsdialogs
  const handleConfirmDialogOpen = (matchId: string, action: 'accept' | 'reject'): void => {
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
  const handleConfirmDialogClose = (): void => {
    setConfirmDialog({
      ...confirmDialog,
      open: false,
    });
  };

  // Handler für das Bestätigen der Aktion im Dialog
  const handleConfirmAction = (): void => {
    const { matchId, action } = confirmDialog;

    if (!matchId) return;

    // These dispatch functions return void, not Promise
    // Success/error handling is done via Redux state
    if (action === 'accept') {
      approveMatch(matchId);
      toast.success('Match erfolgreich akzeptiert');
      loadMatches();
      setTabValue(0);
    } else if (action === 'reject') {
      declineMatch(matchId);
      toast.success('Match erfolgreich abgelehnt');
      loadIncomingRequests();
    }

    handleConfirmDialogClose();
  };

  // Handler für das Öffnen des Termin-Formulars
  const handleOpenAppointmentForm = (match: MatchDisplay): void => {
    setSelectedMatch(match);
    setAppointmentFormOpen(true);
  };

  // Handler für das Schließen des Termin-Formulars
  const handleCloseAppointmentForm = (): void => {
    setAppointmentFormOpen(false);
    setSelectedMatch(null);
  };

  // Handler für das Absenden des Termin-Formulars
  const handleSubmitAppointmentForm = (_data: AppointmentRequest): Promise<void> => {
    // This dispatch function returns void, not Promise
    // Success/error handling is done via Redux state
    scheduleAppointment(_data);
    toast.success('Termin erfolgreich erstellt! 📅');
    handleCloseAppointmentForm();
    // Zu den Terminen navigieren (navigate returns void, cast to satisfy ESLint)
    (navigate as (to: string) => void)('/appointments');
    return Promise.resolve();
  };

  // Lehrbare oder lernbare Skills des Benutzers finden
  const renderMatchButton = (): { label: string; onClick: () => void } =>
    // Navigiere zur Skills-Seite, um dort Skills zu finden und Match-Anfragen zu erstellen
    ({
      label: 'Skills durchsuchen',
      onClick: (): void => {
        (navigate as (to: string) => void)('/skills');
      },
    });
  const matchButtonInfo = renderMatchButton();

  return (
    <PageContainer>
      <PageHeader
        title="Matchmaking"
        subtitle="Verwalte deine Matches und Match-Anfragen"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Matchmaking' }]}
        actions={
          <Button variant="contained" onClick={matchButtonInfo.onClick} startIcon={<AddIcon />}>
            {matchButtonInfo.label}
          </Button>
        }
      />

      {statusMessage ? (
        <AlertMessage
          severity={statusMessage.type}
          message={[statusMessage.text]}
          onClose={() => {
            setStatusMessage(null);
          }}
        />
      ) : null}

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
          onAccept={(matchId) => {
            handleConfirmDialogOpen(matchId, 'accept');
          }}
          onReject={(matchId) => {
            handleConfirmDialogOpen(matchId, 'reject');
          }}
          onSchedule={handleOpenAppointmentForm}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <MatchRequestsOverviewPage embedded />
      </TabPanel>

      {/* Termin-Formular */}
      {selectedMatch ? (
        <AppointmentForm
          open={appointmentFormOpen}
          onClose={handleCloseAppointmentForm}
          onSubmit={handleSubmitAppointmentForm}
          match={selectedMatch}
          isLoading={isLoading}
        />
      ) : null}

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
