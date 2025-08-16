import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
} from '@mui/material';
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
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  School as SkillIcon,
  SwapHoriz as ExchangeIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  HourglassEmpty as PendingIcon,
  Message as MessageIcon,
  VideoCall as VideoCallIcon,
  Share as ShareIcon,
  History as HistoryIcon,
  Star as StarIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import PageHeader from '../../components/layout/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import { useMatchmaking } from '../../hooks/useMatchmaking';
import { MatchDisplay } from '../../types/display/MatchmakingDisplay';
import { toast } from 'react-toastify';
import RescheduleDialog from '../../components/appointments/RescheduleDialog';
import matchmakingService from '../../api/services/matchmakingService';

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

const MatchDetailPage: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { matches, loadMatches, isLoading } = useMatchmaking();
  const [match, setMatch] = useState<MatchDisplay | null>(null);
  const [history, setHistory] = useState<MatchHistoryEntry[]>([]);
  const [dissolveDialogOpen, setDissolveDialogOpen] = useState(false);
  const [dissolveReason, setDissolveReason] = useState('');

  useEffect(() => {
    loadMatches({ page: 1, limit: 100 });
  }, []);

  useEffect(() => {
    if (matchId && matches.length > 0) {
      const foundMatch = matches.find(m => m.id === matchId);
      if (foundMatch) {
        setMatch(foundMatch);
        loadMatchHistory(foundMatch);
      }
    }
  }, [matchId, matches]);

  const loadMatchHistory = (match: MatchDisplay) => {
    // Mock history - in production this would come from an API
    const mockHistory: MatchHistoryEntry[] = [
      {
        id: '1',
        timestamp: match.createdAt,
        action: 'created',
        description: 'Match wurde erstellt',
        icon: <CheckIcon />,
        color: 'success',
      },
      {
        id: '2',
        timestamp: new Date(new Date(match.createdAt).getTime() + 3600000).toISOString(),
        action: 'accepted',
        description: 'Match wurde akzeptiert',
        userName: match.otherUserName,
        icon: <CheckIcon />,
        color: 'primary',
      },
    ];

    if (match.sessionInfo?.completedSessions && match.sessionInfo.completedSessions > 0) {
      mockHistory.push({
        id: '3',
        timestamp: new Date().toISOString(),
        action: 'session_completed',
        description: `${match.sessionInfo.completedSessions} Session(s) abgeschlossen`,
        icon: <VideoCallIcon />,
        color: 'info',
      });
    }

    if (match.status === 'completed') {
      mockHistory.push({
        id: '4',
        timestamp: new Date().toISOString(),
        action: 'completed',
        description: 'Match wurde abgeschlossen',
        icon: <CheckIcon />,
        color: 'success',
      });
    }

    if (match.status === 'dissolved' || match.status === 'cancelled') {
      mockHistory.push({
        id: '5',
        timestamp: new Date().toISOString(),
        action: 'dissolved',
        description: 'Match wurde aufgelöst',
        icon: <CancelIcon />,
        color: 'error',
      });
    }

    setHistory(mockHistory);
  };

  const handleDissolveMatch = async () => {
    if (!match || !dissolveReason.trim()) {
      toast.error('Bitte gib einen Grund für die Auflösung an');
      return;
    }

    try {
      const response = await matchmakingService.dissolveMatch(match.id, dissolveReason);
      
      if (response.success) {
        toast.success('Match wurde erfolgreich aufgelöst');
        navigate('/matchmaking/matches');
      } else {
        toast.error(response.message || 'Fehler beim Auflösen des Matches');
      }
    } catch (error) {
      console.error('Error dissolving match:', error);
      toast.error('Fehler beim Auflösen des Matches');
    }
  };

  const handleCreateAppointment = () => {
    if (match) {
      navigate(`/appointments/create?matchId=${match.id}`);
    }
  };

  const handleViewAppointments = () => {
    if (match) {
      navigate(`/appointments?matchId=${match.id}`);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `Match: ${match?.skillName}`,
      text: `Skill-Match für ${match?.skillName}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link in Zwischenablage kopiert');
    }
  };

  if (isLoading && !match) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <PageHeader
          title="Match Details"
          subtitle="Details zu deinem Match"
        />
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid sx={{ xs:12, sm:8 }}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
          <Grid sx={{ xs:12, sm:4 }}>
            <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={300} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (!match) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <EmptyState
          icon={<CancelIcon />}
          title="Match nicht gefunden"
          description="Das gesuchte Match konnte nicht gefunden werden"
          actionLabel="Zurück zu Matches"
          actionPath="/matchmaking/matches"
        />
      </Container>
    );
  }

  const getStatusIcon = () => {
    switch (match.status) {
      case 'active':
      case 'accepted':
        return <CheckIcon />;
      case 'completed':
        return <CheckIcon />;
      case 'dissolved':
      case 'cancelled':
        return <CancelIcon />;
      default:
        return <PendingIcon />;
    }
  };

  const getStatusColor = () => {
    switch (match.status) {
      case 'active':
      case 'accepted':
        return 'success';
      case 'completed':
        return 'info';
      case 'dissolved':
      case 'cancelled':
        return 'error';
      default:
        return 'warning';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/matchmaking/matches')}
          sx={{ mb: 2 }}
        >
          Zurück zu Matches
        </Button>
      </Box>

      <PageHeader
        title={`Match: ${match.skillName}`}
        subtitle={match.exchangeSkillName ? `Tausch gegen: ${match.exchangeSkillName}` : 'Skill-Sharing'}
      />

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Main Content */}
        <Grid sx={{ xs:12, sm:8 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Chip
                  icon={getStatusIcon()}
                  label={match.status}
                  color={getStatusColor()}
                />
                {match.isSkillExchange && (
                  <Chip
                    icon={<ExchangeIcon />}
                    label="Skill-Tausch"
                    color="primary"
                    variant="outlined"
                  />
                )}
                {match.isMonetary && (
                  <Chip
                    icon={<MoneyIcon />}
                    label={`${match.offeredAmount} ${match.currency || '€'}`}
                    color="warning"
                    variant="outlined"
                  />
                )}
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
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ width: 64, height: 64 }}>
                      <PersonIcon />
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6">
                        {match.otherUserName || 'Unbekannter Nutzer'}
                      </Typography>
                      {match.otherUserRating && match.otherUserRating > 0 && (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <StarIcon sx={{ fontSize: 18, color: 'warning.main' }} />
                          <Typography variant="body2" color="text.secondary">
                            {match.otherUserRating.toFixed(1)} Bewertung
                          </Typography>
                        </Stack>
                      )}
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Mitglied seit {format(new Date(match.createdAt), 'MMMM yyyy', { locale: de })}
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      startIcon={<MessageIcon />}
                      onClick={() => toast.info('Nachrichtenfunktion kommt bald')}
                    >
                      Nachricht
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Box>

            {/* Session Information */}
            {match.sessionInfo && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Session-Informationen
                </Typography>
                <Grid container spacing={2}>
                  <Grid sx={{ xs:12, sm:6 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                          <ScheduleIcon color="action" />
                          <Typography variant="subtitle2" color="text.secondary">
                            Sessions
                          </Typography>
                        </Stack>
                        <Typography variant="h4">
                          {match.sessionInfo.completedSessions}/{match.sessionInfo.totalSessions}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          abgeschlossen
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  {match.sessionInfo.nextSessionDate && (
                    <Grid sx={{ xs:12, sm:6 }}>
                      <Card variant="outlined">
                        <CardContent>
                          <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                            <CalendarIcon color="action" />
                            <Typography variant="subtitle2" color="text.secondary">
                              Nächste Session
                            </Typography>
                          </Stack>
                          <Typography variant="h6">
                            {format(new Date(match.sessionInfo.nextSessionDate), 'dd.MM.yyyy', { locale: de })}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {format(new Date(match.sessionInfo.nextSessionDate), 'HH:mm', { locale: de })} Uhr
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {match.status === 'active' || match.status === 'accepted' ? (
                <>
                  <Button
                    variant="contained"
                    startIcon={<CalendarIcon />}
                    onClick={handleCreateAppointment}
                  >
                    Termin erstellen
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<CalendarIcon />}
                    onClick={handleViewAppointments}
                  >
                    Termine anzeigen
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => setDissolveDialogOpen(true)}
                  >
                    Match auflösen
                  </Button>
                </>
              ) : match.status === 'completed' ? (
                <Button
                  variant="outlined"
                  startIcon={<HistoryIcon />}
                  onClick={handleViewAppointments}
                >
                  Vergangene Termine
                </Button>
              ) : null}
            </Box>
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
                    <TimelineDot color={entry.color || 'grey'}>
                      {entry.icon || <HistoryIcon />}
                    </TimelineDot>
                    {index < history.length - 1 && <TimelineConnector />}
                  </TimelineSeparator>
                  <TimelineContent>
                    <Typography variant="subtitle2">
                      {entry.description}
                    </Typography>
                    {entry.userName && (
                      <Typography variant="body2" color="text.secondary">
                        von {entry.userName}
                      </Typography>
                    )}
                  </TimelineContent>
                </TimelineItem>
              ))}
            </Timeline>
          </Paper>
        </Grid>

        {/* Sidebar */}
        <Grid sx={{ xs:12, sm:4 }}>
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
                <ListItemText
                  primary="Skill"
                  secondary={match.skillName}
                />
              </ListItem>
              {match.exchangeSkillName && (
                <ListItem disablePadding sx={{ mb: 2 }}>
                  <ListItemIcon>
                    <ExchangeIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Tausch-Skill"
                    secondary={match.exchangeSkillName}
                  />
                </ListItem>
              )}
              <ListItem disablePadding sx={{ mb: 2 }}>
                <ListItemIcon>
                  <CalendarIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Erstellt am"
                  secondary={format(new Date(match.createdAt), 'dd.MM.yyyy', { locale: de })}
                />
              </ListItem>
              {match.isMonetary && (
                <ListItem disablePadding sx={{ mb: 2 }}>
                  <ListItemIcon>
                    <MoneyIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Vergütung"
                    secondary={`${match.offeredAmount} ${match.currency || '€'}`}
                  />
                </ListItem>
              )}
              {match.location && (
                <ListItem disablePadding>
                  <ListItemIcon>
                    <LocationIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Ort"
                    secondary={match.location}
                  />
                </ListItem>
              )}
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
              <Alert severity="warning">
                Gib konstruktives Feedback nach jeder Session
              </Alert>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Dissolve Dialog */}
      <RescheduleDialog
        open={dissolveDialogOpen}
        onClose={() => setDissolveDialogOpen(false)}
        appointment={{
          id: match.id,
          skill: { name: match.skillName },
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
        } as any}
        onReschedule={async (_, __, reason) => {
          if (reason) {
            setDissolveReason(reason);
            await handleDissolveMatch();
          }
        }}
        availableSlots={[]}
      />
    </Container>
  );
};

export default MatchDetailPage;