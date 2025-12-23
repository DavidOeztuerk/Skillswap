import React, { useEffect, useState, useMemo } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Person as PersonIcon,
  School as SkillIcon,
  SwapHoriz as ExchangeIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  HourglassEmpty as PendingIcon,
  ChatBubbleOutline as ChatBubbleOutlineIcon,
  Close as CloseIcon,
  VideoCall as VideoCallIcon,
  Share as ShareIcon,
  History as HistoryIcon,
  Star as StarIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  IconButton,
  Tooltip,
  Alert,
  Skeleton,
  Drawer,
} from '@mui/material';
import { useAppSelector } from '../../../core/store/store.hooks';
import PageHeader from '../../../shared/components/layout/PageHeader';
import EmptyState from '../../../shared/components/ui/EmptyState';
import RescheduleDialog from '../../appointments/components/RescheduleDialog';
import InlineChatPanel from '../../chat/components/InlineChatPanel';
import useMatchmaking from '../hooks/useMatchmaking';

interface MatchHistoryEntry {
  id: string;
  timestamp: string;
  action: string;
  description: string;
  userId?: string;
  userName?: string;
  icon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
}

// Status configuration for icons and colors
type MatchStatus =
  | 'active'
  | 'accepted'
  | 'completed'
  | 'dissolved'
  | 'cancelled'
  | 'rejected'
  | 'pending';

const STATUS_CONFIG: Record<
  MatchStatus,
  { icon: React.ReactElement; color: 'success' | 'info' | 'error' | 'warning' }
> = {
  active: { icon: <CheckIcon />, color: 'success' },
  accepted: { icon: <CheckIcon />, color: 'success' },
  completed: { icon: <CheckIcon />, color: 'info' },
  dissolved: { icon: <CancelIcon />, color: 'error' },
  cancelled: { icon: <CancelIcon />, color: 'error' },
  rejected: { icon: <CancelIcon />, color: 'error' },
  pending: { icon: <PendingIcon />, color: 'warning' },
};

// Helper to build match history entries
interface MatchForHistory {
  createdAt: string;
  acceptedAt?: string | null;
  completedAt?: string | null;
  status: string;
  partnerName?: string;
  sessionInfo?: {
    completedSessions?: number;
    nextSessionDate?: string | null;
  };
}

// Loading state component
const LoadingState: React.FC = () => (
  <Container maxWidth="lg" sx={{ py: 4 }}>
    <PageHeader title="Match Details" subtitle="Details zu deinem Match" />
    <Grid container spacing={3} sx={{ mt: 2 }}>
      <Grid sx={{ xs: 12, sm: 8 }}>
        <Skeleton variant="rectangular" height={400} />
      </Grid>
      <Grid sx={{ xs: 12, sm: 4 }}>
        <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={300} />
      </Grid>
    </Grid>
  </Container>
);

// Empty state component
const EmptyMatchState: React.FC = () => (
  <Container maxWidth="lg" sx={{ py: 4 }}>
    <EmptyState
      icon={<CancelIcon />}
      title="Match nicht gefunden"
      description="Das gesuchte Match konnte nicht gefunden werden"
      actionLabel="Zurück zu Matchmaking"
      actionPath="/matchmaking"
    />
  </Container>
);

// Match Partner Card component
interface MatchPartnerCardProps {
  partnerName: string;
  partnerRating?: number | null;
  createdAt: string;
  showChat: boolean;
  onToggleChat: () => void;
}

const MatchPartnerCard: React.FC<MatchPartnerCardProps> = ({
  partnerName,
  partnerRating,
  createdAt,
  showChat,
  onToggleChat,
}) => (
  <Card variant="outlined">
    <CardContent>
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar sx={{ width: 64, height: 64 }}>
          <PersonIcon />
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6">{partnerName || 'Unbekannter Nutzer'}</Typography>
          {partnerRating != null && partnerRating > 0 ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <StarIcon sx={{ fontSize: 18, color: 'warning.main' }} />
              <Typography variant="body2" color="text.secondary">
                {partnerRating.toFixed(1)} Bewertung
              </Typography>
            </Stack>
          ) : null}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Mitglied seit {format(new Date(createdAt), 'MMMM yyyy', { locale: de })}
          </Typography>
        </Box>
        <Tooltip title={showChat ? 'Chat schließen' : 'Chat öffnen'}>
          <IconButton
            color={showChat ? 'primary' : 'default'}
            onClick={onToggleChat}
            sx={{
              bgcolor: showChat ? 'primary.main' : 'action.hover',
              color: showChat ? 'primary.contrastText' : 'text.primary',
              '&:hover': {
                bgcolor: showChat ? 'primary.dark' : 'action.selected',
              },
            }}
          >
            {showChat ? <CloseIcon /> : <ChatBubbleOutlineIcon />}
          </IconButton>
        </Tooltip>
      </Stack>
    </CardContent>
  </Card>
);

// Session Info Section component
interface SessionInfoProps {
  sessionInfo: {
    completedSessions?: number;
    totalSessions?: number;
    nextSessionDate?: string | null;
  };
}

const SessionInfoSection: React.FC<SessionInfoProps> = ({ sessionInfo }) => (
  <Box sx={{ mb: 3 }}>
    <Typography variant="h6" gutterBottom>
      Session-Informationen
    </Typography>
    <Grid container spacing={2}>
      <Grid sx={{ xs: 12, sm: 6 }}>
        <Card variant="outlined">
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" mb={1}>
              <ScheduleIcon color="action" />
              <Typography variant="subtitle2" color="text.secondary">
                Sessions
              </Typography>
            </Stack>
            <Typography variant="h4">
              {sessionInfo.completedSessions}/{sessionInfo.totalSessions}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              abgeschlossen
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      {sessionInfo.nextSessionDate ? (
        <Grid sx={{ xs: 12, sm: 6 }}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <CalendarIcon color="action" />
                <Typography variant="subtitle2" color="text.secondary">
                  Nächste Session
                </Typography>
              </Stack>
              <Typography variant="h6">
                {format(new Date(sessionInfo.nextSessionDate), 'dd.MM.yyyy', { locale: de })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {format(new Date(sessionInfo.nextSessionDate), 'HH:mm', { locale: de })} Uhr
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ) : null}
    </Grid>
  </Box>
);

// Action Buttons component
interface ActionButtonsProps {
  status: string;
  onCreateAppointment: () => void;
  onViewAppointments: () => void;
  onDissolve: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  status,
  onCreateAppointment,
  onViewAppointments,
  onDissolve,
}) => {
  if (status === 'active' || status === 'accepted') {
    return (
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button variant="contained" startIcon={<CalendarIcon />} onClick={onCreateAppointment}>
          Termin erstellen
        </Button>
        <Button variant="outlined" startIcon={<CalendarIcon />} onClick={onViewAppointments}>
          Termine anzeigen
        </Button>
        <Button variant="outlined" color="error" startIcon={<CancelIcon />} onClick={onDissolve}>
          Match auflösen
        </Button>
      </Box>
    );
  }

  if (status === 'completed') {
    return (
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button variant="outlined" startIcon={<HistoryIcon />} onClick={onViewAppointments}>
          Vergangene Termine
        </Button>
      </Box>
    );
  }

  return null;
};

function buildMatchHistory(match: MatchForHistory): MatchHistoryEntry[] {
  const entries: MatchHistoryEntry[] = [
    {
      id: '1',
      timestamp: match.createdAt,
      action: 'created',
      description: 'Match wurde erstellt',
      icon: <CheckIcon />,
      color: 'success',
    },
  ];

  if (match.acceptedAt) {
    entries.push({
      id: '2',
      timestamp: match.acceptedAt,
      action: 'accepted',
      description: 'Match wurde akzeptiert',
      userName: match.partnerName,
      icon: <CheckIcon />,
      color: 'primary',
    });
  }

  const completedSessions = match.sessionInfo?.completedSessions;
  if (completedSessions != null && completedSessions > 0) {
    entries.push({
      id: '3',
      timestamp: match.sessionInfo?.nextSessionDate ?? match.acceptedAt ?? match.createdAt,
      action: 'session_completed',
      description: `${completedSessions} Session(s) abgeschlossen`,
      icon: <VideoCallIcon />,
      color: 'info',
    });
  }

  if (match.status === 'completed' && match.completedAt) {
    entries.push({
      id: '4',
      timestamp: match.completedAt,
      action: 'completed',
      description: 'Match wurde abgeschlossen',
      icon: <CheckIcon />,
      color: 'success',
    });
  }

  if (match.status === 'dissolved' || match.status === 'cancelled') {
    entries.push({
      id: '5',
      timestamp: match.completedAt ?? match.acceptedAt ?? match.createdAt,
      action: 'dissolved',
      description: 'Match wurde aufgelöst',
      icon: <CancelIcon />,
      color: 'error',
    });
  }

  return entries;
}

const MatchDetailPage: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  // NOTE: useMatchmaking returns isLoading from state.isLoading, but fetchMatches uses isLoadingMatches!
  // We need to use the Redux selector directly for accurate loading state
  const { matches, loadMatches } = useMatchmaking();
  const isLoadingMatches = useAppSelector((state) => state.matchmaking.isLoadingMatches);
  const [showChat, setShowChat] = useState(false);
  const [dissolveDialogOpen, setDissolveDialogOpen] = useState(false);
  const [dissolveReason, setDissolveReason] = useState('');
  // Track if we've attempted to load matches
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  // Find match SYNCHRONOUSLY with useMemo - no extra render cycle!
  const match = useMemo(() => {
    if (!matchId || matches.length === 0) return null;
    return matches.find((m) => m.id === matchId) ?? null;
  }, [matchId, matches]);

  // Derive history from match using useMemo (avoids setState-in-effect)
  const history = useMemo((): MatchHistoryEntry[] => {
    if (!match) return [];
    return buildMatchHistory(match);
  }, [match]);

  // Load matches on mount
  useEffect(() => {
    loadMatches({ pageNumber: 1, pageSize: 100 });
    // Defer state update to avoid synchronous setState in effect body
    const timeoutId = setTimeout(() => {
      setHasAttemptedLoad(true);
    }, 0);
    return () => {
      clearTimeout(timeoutId);
    };
  }, [loadMatches]);

  const handleDissolveMatch = async (): Promise<void> => {
    if (!match || !dissolveReason.trim()) {
      toast.error('Bitte gib einen Grund für die Auflösung an');
      return;
    }

    try {
      const { default: matchmakingService } = await import('../services/matchmakingService');
      const response = await matchmakingService.dissolveMatch(match.id, dissolveReason);

      if (response.success) {
        toast.success('Match wurde erfolgreich aufgelöst');
        void navigate('/matchmaking');
      } else {
        toast.error(response.message ?? 'Fehler beim Auflösen des Matches');
      }
    } catch (error) {
      console.error('Error dissolving match:', error);
      toast.error('Fehler beim Auflösen des Matches');
    }
  };

  const handleCreateAppointment = (): void => {
    if (match) {
      void navigate(`/appointments/create?matchId=${match.id}`);
    }
  };

  const handleViewAppointments = (): void => {
    if (match) {
      void navigate(`/appointments?matchId=${match.id}`);
    }
  };

  const handleShare = async (): Promise<void> => {
    const skillName = match?.skillName ?? 'Unknown';
    const shareData = {
      title: `Match: ${skillName}`,
      text: `Skill-Match für ${skillName}`,
      url: window.location.href,
    };

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share(shareData);
      } catch {
        console.debug('Share cancelled');
      }
    } else {
      void navigator.clipboard.writeText(window.location.href);
      toast.success('Link in Zwischenablage kopiert');
    }
  };

  // Show loading state while:
  // 1. Data is actively loading (isLoadingMatches)
  // 2. Haven't attempted to load yet
  // 3. Matches are empty AND match not found (still loading or empty result)
  const showLoading = isLoadingMatches || !hasAttemptedLoad || (matches.length === 0 && !match);

  if (showLoading) {
    return <LoadingState />;
  }

  if (!match) {
    return <EmptyMatchState />;
  }

  // Get status config from lookup
  const statusConfig = STATUS_CONFIG[match.status as MatchStatus];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageHeader
        title={`Match: ${match.skillName}`}
        subtitle={
          match.exchangeSkillName ? `Tausch gegen: ${match.exchangeSkillName}` : 'Skill-Sharing'
        }
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Matchmaking', href: '/matchmaking' },
          { label: match.skillName, isActive: true },
        ]}
      />

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Main Content */}
        <Grid sx={{ xs: 12, sm: 8 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <Chip icon={statusConfig.icon} label={match.status} color={statusConfig.color} />
                {match.isSkillExchange ? (
                  <Chip
                    icon={<ExchangeIcon />}
                    label="Skill-Tausch"
                    color="primary"
                    variant="outlined"
                  />
                ) : null}
                {match.isMonetary ? (
                  <Chip
                    icon={<MoneyIcon />}
                    label={`${match.offeredAmount ?? 0} ${match.currency ?? '€'}`}
                    color="warning"
                    variant="outlined"
                  />
                ) : null}
              </Stack>
              <Tooltip title="Teilen">
                <IconButton onClick={handleShare}>
                  <ShareIcon />
                </IconButton>
              </Tooltip>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* Match Partner */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Match-Partner
              </Typography>
              <MatchPartnerCard
                partnerName={match.partnerName}
                partnerRating={match.partnerRating}
                createdAt={match.createdAt}
                showChat={showChat}
                onToggleChat={() => {
                  setShowChat(!showChat);
                }}
              />
            </Box>

            {/* Session Information */}
            {match.sessionInfo ? <SessionInfoSection sessionInfo={match.sessionInfo} /> : null}

            {/* Action Buttons */}
            <ActionButtons
              status={match.status}
              onCreateAppointment={handleCreateAppointment}
              onViewAppointments={handleViewAppointments}
              onDissolve={() => {
                setDissolveDialogOpen(true);
              }}
            />
          </Paper>

          {/* Match History */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Match-Verlauf
            </Typography>
            <Timeline>
              {history.map((entry, index) => (
                <TimelineItem key={entry.id}>
                  <TimelineOppositeContent color="text.secondary">
                    <Typography variant="caption">
                      {format(new Date(entry.timestamp), 'dd.MM.yyyy HH:mm', { locale: de })}
                    </Typography>
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot color={entry.color ?? 'grey'}>
                      {entry.icon ?? <HistoryIcon />}
                    </TimelineDot>
                    {index < history.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="subtitle2">{entry.description}</Typography>
                    {entry.userName ? (
                      <Typography variant="body2" color="text.secondary">
                        von {entry.userName}
                      </Typography>
                    ) : null}
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid sx={{ xs: 12, sm: 4 }}>
          {/* Match Details */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Match-Details
            </Typography>
            <List disablePadding>
              <ListItem disablePadding sx={{ mb: 2 }}>
                <ListItemIcon>
                  <SkillIcon />
                </ListItemIcon>
                <ListItemText primary="Skill" secondary={match.skillName} />
              </ListItem>
              {match.exchangeSkillName ? (
                <ListItem disablePadding sx={{ mb: 2 }}>
                  <ListItemIcon>
                    <ExchangeIcon />
                  </ListItemIcon>
                  <ListItemText primary="Tausch-Skill" secondary={match.exchangeSkillName} />
                </ListItem>
              ) : null}
              <ListItem disablePadding sx={{ mb: 2 }}>
                <ListItemIcon>
                  <CalendarIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Erstellt am"
                  secondary={format(new Date(match.createdAt), 'dd.MM.yyyy', { locale: de })}
                />
              </ListItem>
              {match.isMonetary ? (
                <ListItem disablePadding sx={{ mb: 2 }}>
                  <ListItemIcon>
                    <MoneyIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Vergütung"
                    secondary={`${match.offeredAmount ?? 0} ${match.currency ?? '€'}`}
                  />
                </ListItem>
              ) : null}
              {match.location ? (
                <ListItem disablePadding>
                  <ListItemIcon>
                    <LocationIcon />
                  </ListItemIcon>
                  <ListItemText primary="Ort" secondary={match.location} />
                </ListItem>
              ) : null}
            </List>
          </Paper>

          {/* Tips */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Tipps für erfolgreiche Matches
            </Typography>
            <Stack spacing={2}>
              <Alert severity="info">
                Kommuniziere klar deine Erwartungen und Ziele für die Sessions
              </Alert>
              <Alert severity="success">
                Sei pünktlich und gut vorbereitet für vereinbarte Termine
              </Alert>
              <Alert severity="warning">Gib konstruktives Feedback nach jeder Session</Alert>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Dissolve Dialog */}
      <RescheduleDialog
        open={dissolveDialogOpen}
        onClose={() => {
          setDissolveDialogOpen(false);
        }}
        appointment={
          {
            id: match.id,
            skill: { name: match.skillName },
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
          } as Parameters<typeof RescheduleDialog>[0]['appointment']
        }
        onReschedule={async (_, __, reason) => {
          if (reason) {
            setDissolveReason(reason);
            await handleDissolveMatch();
          }
        }}
        availableSlots={[]}
      />

      {/* Chat Drawer - Opens from right */}
      <Drawer
        anchor="right"
        open={showChat}
        onClose={() => {
          setShowChat(false);
        }}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: 400 },
              maxWidth: '100%',
            },
          },
        }}
      >
        <InlineChatPanel
          partnerId={match.partnerId}
          partnerName={match.partnerName}
          partnerAvatarUrl={match.partnerAvatar ?? undefined}
          skillId={match.skillId}
          skillName={match.skillName}
          height="100vh"
          onClose={() => {
            setShowChat(false);
          }}
          defaultExpanded
        />
      </Drawer>
    </Container>
  );
};

export default MatchDetailPage;
