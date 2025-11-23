import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  Paper,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Rating,
  Alert,
  Skeleton,
  Pagination,
} from '@mui/material';
import {
  Handshake as HandshakeIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  SwapHoriz as SwapIcon,
  AttachMoney as MoneyIcon,
  Cancel as CancelIcon,
  CheckCircle as CompleteIcon,
  Star as StarIcon,
  CalendarToday as CalendarIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useMatchmaking } from '../../hooks/useMatchmaking';
import { MatchDisplay } from '../../types/contracts/MatchmakingDisplay';
import PageHeader from '../../components/layout/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import { toast } from 'react-toastify';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const MatchesPage: React.FC = () => {
  const navigate = useNavigate();
  const { matches, loadMatches, isLoading } = useMatchmaking();
  const [tabValue, setTabValue] = useState(0);
  const [selectedMatch, setSelectedMatch] = useState<MatchDisplay | null>(null);
  const [dissolveDialogOpen, setDissolveDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [dissolveReason, setDissolveReason] = useState('');
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 9;

  useEffect(() => {
    loadMatches({ pageNumber: 1, pageSize: 100 });
  }, []);

  // Filter matches by status - MatchDisplay uses string literals
  const activeMatches = matches.filter(m => m.status === 'accepted' || m.status === 'active');
  const completedMatches = matches.filter(m => m.status === 'completed');
  const cancelledMatches = matches.filter(m => m.status === 'rejected' || m.status === 'cancelled');

  const getCurrentMatches = () => {
    switch (tabValue) {
      case 0:
        return activeMatches;
      case 1:
        return completedMatches;
      case 2:
        return cancelledMatches;
      default:
        return activeMatches;
    }
  };

  const currentMatches = getCurrentMatches();
  const totalPages = Math.ceil(currentMatches.length / pageSize);
  const paginatedMatches = currentMatches.slice((page - 1) * pageSize, page * pageSize);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(1);
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleViewAppointments = (matchId: string) => {
    navigate(`/appointments?matchId=${matchId}`);
  };

  const handleCreateAppointment = (matchId: string) => {
    navigate(`/appointments/create?matchId=${matchId}`);
  };

  const handleDissolveMatch = async () => {
    if (!selectedMatch || !dissolveReason.trim()) {
      toast.error('Bitte gib einen Grund für die Auflösung an');
      return;
    }

    try {
      const { default: matchmakingService } = await import('../../api/services/matchmakingService');
      const response = await matchmakingService.dissolveMatch(selectedMatch.id, dissolveReason);
      
      if (response.success) {
        toast.success('Match wurde erfolgreich aufgelöst');
        setDissolveDialogOpen(false);
        setSelectedMatch(null);
        setDissolveReason('');
        await loadMatches({ pageNumber: 1, pageSize: 100 });
      } else {
        toast.error(response.message || 'Fehler beim Auflösen des Matches');
      }
    } catch (error) {
      console.error('Error dissolving match:', error);
      toast.error('Fehler beim Auflösen des Matches');
    }
  };

  const handleCompleteMatch = async () => {
    if (!selectedMatch) return;

    try {
      const { default: matchmakingService } = await import('../../api/services/matchmakingService');
      const response = await matchmakingService.completeMatch(
        selectedMatch.id,
        rating,
        60,
        feedback || undefined,
        true
      );

      if (response.success) {
        toast.success('Match wurde erfolgreich abgeschlossen');
        setCompleteDialogOpen(false);
        setSelectedMatch(null);
        setRating(5);
        setFeedback('');
        await loadMatches({ pageNumber: 1, pageSize: 100 });
      } else {
        toast.error(response.message || 'Fehler beim Abschließen des Matches');
      }
    } catch (error) {
      console.error('Error completing match:', error);
      toast.error('Fehler beim Abschließen des Matches');
    }
  };

  const getMatchTypeIcon = (match: MatchDisplay) => {
    if (match.isSkillExchange) return <SwapIcon />;
    if (match.isMonetary) return <MoneyIcon />;
    return <HandshakeIcon />;
  };

  const getMatchTypeLabel = (match: MatchDisplay) => {
    if (match.isSkillExchange) return 'Skill-Tausch';
    if (match.isMonetary) return `${match.offeredAmount} ${match.currency || '€'}`;
    return 'Skill-Sharing';
  };

  const renderMatchCard = (match: MatchDisplay) => (
    <Grid sx={{ xs:12, sm:6, md:4 }} key={match.id}>
      <Card sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        '&:hover': { boxShadow: 3 },
        cursor: 'pointer'
      }}
      onClick={() => navigate(`/matchmaking/matches/${match.id}`)}>
        <CardContent sx={{ flexGrow: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Chip
              icon={getMatchTypeIcon(match)}
              label={getMatchTypeLabel(match)}
              size="small"
              color={match.isSkillExchange ? 'primary' : match.isMonetary ? 'warning' : 'default'}
            />
            <Chip
              label={match.status}
              size="small"
              color={
                match.status === 'active' ? 'success' :
                match.status === 'completed' ? 'info' :
                'error'
              }
            />
          </Stack>

          <Typography variant="h6" gutterBottom>
            {match.skillName}
          </Typography>

          {match.exchangeSkillName && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              ⇄ {match.exchangeSkillName}
            </Typography>
          )}

          <Stack direction="row" spacing={1} alignItems="center" mb={2}>
            <Avatar sx={{ width: 32, height: 32 }}>
              <PersonIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="body2">
                {match.partnerName || 'Unbekannter Nutzer'}
              </Typography>
              {match.partnerRating && match.partnerRating > 0 && (
                <Rating value={match.partnerRating} size="small" readOnly />
              )}
            </Box>
          </Stack>

          {match.sessionInfo && (
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <ScheduleIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {match.sessionInfo.completedSessions}/{match.sessionInfo.totalSessions} Sessions
                </Typography>
              </Stack>
              {match.sessionInfo.nextSessionDate && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CalendarIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Nächste: {format(new Date(match.sessionInfo.nextSessionDate), 'dd.MM.yyyy', { locale: de })}
                  </Typography>
                </Stack>
              )}
            </Stack>
          )}

          <Box mt={2}>
            <Typography variant="caption" color="text.secondary">
              Erstellt: {format(new Date(match.createdAt), 'dd.MM.yyyy', { locale: de })}
            </Typography>
          </Box>
        </CardContent>

        <CardActions sx={{ p: 2, pt: 0 }}>
          {match.status === 'active' && (
            <>
              <Button
                size="small"
                startIcon={<CalendarIcon />}
                onClick={() => handleViewAppointments(match.id)}
              >
                Termine
              </Button>
              <Button
                size="small"
                color="warning"
                startIcon={<CancelIcon />}
                onClick={() => {
                  setSelectedMatch(match);
                  setDissolveDialogOpen(true);
                }}
              >
                Auflösen
              </Button>
            </>
          )}
          {match.status === 'accepted' && (
            <>
              <Button
                size="small"
                variant="contained"
                startIcon={<CalendarIcon />}
                onClick={() => handleCreateAppointment(match.id)}
              >
                Termin erstellen
              </Button>
              <Button
                size="small"
                color="success"
                startIcon={<CompleteIcon />}
                onClick={() => {
                  setSelectedMatch(match);
                  setCompleteDialogOpen(true);
                }}
              >
                Abschließen
              </Button>
            </>
          )}
          {match.status === 'completed' && match.rating && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Rating value={match.rating} size="small" readOnly />
              <Typography variant="body2" color="text.secondary">
                Bewertet
              </Typography>
            </Stack>
          )}
        </CardActions>
      </Card>
    </Grid>
  );

  if (isLoading && matches.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <PageHeader
          title="Meine Matches"
          subtitle="Verwalte deine aktiven und vergangenen Skill-Matches"
        />
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {[...Array(6)].map((_, index) => (
            <Grid sx={{ xs:12, sm:6, md:4 }} key={index}>
              <Skeleton variant="rectangular" height={250} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageHeader
        title="Meine Matches"
        subtitle="Verwalte deine aktiven und vergangenen Skill-Matches"
      />

      <Paper sx={{ mb: 3 }}>
        <Grid container spacing={3} sx={{ p: 2 }}>
          <Grid sx={{ xs:12, sm:4 }}>
            <Stack alignItems="center">
              <Typography variant="h4" color="primary">
                {activeMatches.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Aktive Matches
              </Typography>
            </Stack>
          </Grid>
          <Grid sx={{ xs:12, sm:4 }}>
            <Stack alignItems="center">
              <Typography variant="h4" color="success.main">
                {completedMatches.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Abgeschlossen
              </Typography>
            </Stack>
          </Grid>
          <Grid  sx={{ xs:12, sm:4 }}>
            <Stack alignItems="center">
              <Typography variant="h4" color="error.main">
                {cancelledMatches.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Aufgelöst
              </Typography>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label={`Aktiv (${activeMatches.length})`} />
          <Tab label={`Abgeschlossen (${completedMatches.length})`} />
          <Tab label={`Aufgelöst (${cancelledMatches.length})`} />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {activeMatches.length === 0 ? (
          <EmptyState
            icon={<HandshakeIcon />}
            title="Keine aktiven Matches"
            description="Du hast derzeit keine aktiven Skill-Matches"
            actionLabel="Matches finden"
            actionPath="/matchmaking"
          />
        ) : (
          <>
            <Grid container spacing={3}>
              {paginatedMatches.map(renderMatchCard)}
            </Grid>
            {totalPages > 1 && (
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {completedMatches.length === 0 ? (
          <EmptyState
            icon={<CompleteIcon />}
            title="Keine abgeschlossenen Matches"
            description="Du hast noch keine Matches abgeschlossen"
          />
        ) : (
          <>
            <Grid container spacing={3}>
              {paginatedMatches.map(renderMatchCard)}
            </Grid>
            {totalPages > 1 && (
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {cancelledMatches.length === 0 ? (
          <EmptyState
            icon={<CancelIcon />}
            title="Keine aufgelösten Matches"
            description="Du hast noch keine Matches aufgelöst"
          />
        ) : (
          <>
            <Grid container spacing={3}>
              {paginatedMatches.map(renderMatchCard)}
            </Grid>
            {totalPages > 1 && (
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </TabPanel>

      {/* Dissolve Match Dialog */}
      <Dialog open={dissolveDialogOpen} onClose={() => setDissolveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Match auflösen
          <IconButton
            onClick={() => setDissolveDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Bist du sicher, dass du dieses Match auflösen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.
          </DialogContentText>
          <Alert severity="info" sx={{ mb: 2 }}>
            Alle zukünftigen Termine werden automatisch storniert.
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Grund für die Auflösung"
            value={dissolveReason}
            onChange={(e) => setDissolveReason(e.target.value)}
            placeholder="Bitte gib einen Grund an..."
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDissolveDialogOpen(false)}>Abbrechen</Button>
          <Button
            onClick={handleDissolveMatch}
            color="warning"
            variant="contained"
            disabled={!dissolveReason.trim()}
          >
            Match auflösen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Complete Match Dialog */}
      <Dialog open={completeDialogOpen} onClose={() => setCompleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Match abschließen
          <IconButton
            onClick={() => setCompleteDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Bewerte deine Erfahrung mit diesem Match
          </DialogContentText>
          
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Bewertung
              </Typography>
              <Rating
                value={rating}
                onChange={(_, value) => setRating(value || 5)}
                size="large"
              />
            </Box>
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Feedback (optional)"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Teile deine Erfahrung..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompleteDialogOpen(false)}>Abbrechen</Button>
          <Button
            onClick={handleCompleteMatch}
            color="success"
            variant="contained"
            startIcon={<StarIcon />}
          >
            Bewerten & Abschließen
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MatchesPage;