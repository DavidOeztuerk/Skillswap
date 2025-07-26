import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Tabs,
  Tab,
  Avatar,
  Chip,
  IconButton,
  Badge,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  Group as GroupIcon,
  Send as SendIcon,
  Star as StarIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Psychology as PsychologyIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/store.hooks';
import {
  acceptMatch,
  rejectMatch,
  rateMatch,
  fetchIncomingMatchRequests,
  fetchOutgoingMatchRequests,
  getMatch,
  createMatchRequest,
} from '../../features/matchmaking/matchmakingSlice';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/layout/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const EnhancedMatchmakingPage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  const dispatch = useAppDispatch();
  const {
    matchResults: suggestions = [],
    matches: myMatches = [],
    incomingRequests = [],
    outgoingRequests = [],
    isLoading,
    isLoadingRequests,
    error,
  } = useAppSelector((state) => state.matchmaking);

  useEffect(() => {
    // Load initial data - we'll need to adjust these calls based on actual slice
    dispatch(getMatch(''));
    dispatch(fetchIncomingMatchRequests());
    dispatch(fetchOutgoingMatchRequests());
  }, [dispatch]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleAcceptMatch = (matchId: string) => {
    dispatch(acceptMatch(matchId));
  };

  const handleRejectMatch = (matchId: string) => {
    dispatch(rejectMatch(matchId));
  };

  const handleSendRequest = (userId: string) => {
    dispatch(createMatchRequest({ targetUserId: userId, skillId: 'temp', message: 'Skill-Tausch anfragen', isLearningMode: true }));
  };

  const handleRateMatch = () => {
    if (selectedMatch && rating > 0) {
      dispatch(rateMatch({
        matchId: selectedMatch.id,
        rating,
        feedback: feedback.trim() || undefined,
      }));
      setRatingDialogOpen(false);
      setSelectedMatch(null);
      setRating(0);
      setFeedback('');
    }
  };

  const openRatingDialog = (match: any) => {
    setSelectedMatch(match);
    setRatingDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      case 'completed':
        return 'info';
      default:
        return 'default';
    }
  };

  if (isLoading && suggestions.length === 0) {
    return <LoadingSpinner fullPage message="Suche nach Matches..." />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Skill-Matching"
        subtitle="Finde passende Lernpartner und tausche deine Skills"
        icon={<PsychologyIcon />}
        actions={
          <Box display="flex" gap={1}>
            <Button variant="contained" startIcon={<SearchIcon />}>
              Erweiterte Suche
            </Button>
            <IconButton onClick={() => dispatch(getMatch(''))}>
              <RefreshIcon />
            </IconButton>
          </Box>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}

      {/* Quick Stats */}
      <Box display="flex" gap={2} sx={{ mb: 3 }}>
        <Box sx={{ flex: '1 1 0' }}>
          <Card>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6">
                    {suggestions.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Vorschläge
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                  <PsychologyIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Tabs value={currentTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab
              label={
                <Box display="flex" alignItems="center">
                  <SearchIcon sx={{ mr: 1 }} />
                  Vorschläge
                  {suggestions.length > 0 && (
                    <Badge badgeContent={suggestions.length} color="primary" sx={{ ml: 1 }} />
                  )}
                </Box>
              }
            />
            <Tab
              label={
                <Box display="flex" alignItems="center">
                  <GroupIcon sx={{ mr: 1 }} />
                  Meine Matches
                </Box>
              }
            />
            <Tab
              label={
                <Box display="flex" alignItems="center">
                  <PersonAddIcon sx={{ mr: 1 }} />
                  Anfragen
                  {incomingRequests.length > 0 && (
                    <Badge badgeContent={incomingRequests.length} color="error" sx={{ ml: 1 }} />
                  )}
                </Box>
              }
            />
          </Tabs>
        </CardContent>
      </Card>

      {/* Suggestions Tab */}
      <TabPanel value={currentTab} index={0}>
        <Box display="flex" flexDirection="column" gap={3}>
          {suggestions.length === 0 ? (
            <Box>
              <Box textAlign="center" py={4}>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  Keine Vorschläge gefunden
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Erweitere deine Suchkriterien!
                </Typography>
                <Button variant="contained" startIcon={<SearchIcon />} sx={{ mt: 2 }}>
                  Erweiterte Suche
                </Button>
              </Box>
            </Box>
          ) : (
            <Box display="flex" flexWrap="wrap" gap={3}>
              {suggestions.map((suggestion: any) => (
              <Box key={suggestion.id} sx={{ flex: '1 1 calc(50% - 12px)', minWidth: '300px' }}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {suggestion.user?.firstName?.[0] || 'U'}
                        </Avatar>
                        <Box>
                          <Typography variant="h6">
                            {suggestion.user?.firstName} {suggestion.user?.lastName}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {suggestion.skill?.name}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={`${suggestion.compatibility}% Match`}
                        color="primary"
                        size="small"
                      />
                    </Box>

                    <Box display="flex" gap={1} mt={2}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleSendRequest(suggestion.user.id)}
                        startIcon={<SendIcon />}
                        fullWidth
                      >
                        Anfrage senden
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
              ))}
            </Box>
          )}
        </Box>
      </TabPanel>

      {/* My Matches Tab */}
      <TabPanel value={currentTab} index={1}>
        <Box>
          <Box>
            <Typography variant="h6">
              Meine Matches ({myMatches.length})
            </Typography>
            
            <Box display="flex" flexDirection="column" gap={2}>
              {myMatches.map((match: any) => (
                <Box key={match.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" flex={1}>
                          <Avatar sx={{ mr: 2 }}>
                            {match.partner?.firstName?.[0] || 'P'}
                          </Avatar>
                          <Box flex={1}>
                            <Typography variant="h6">
                              {match.partner?.firstName} {match.partner?.lastName}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              {match.skill?.name}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box display="flex" alignItems="center" gap={2}>
                          <Chip
                            label={match.status}
                            color={getStatusColor(match.status) as any}
                            size="small"
                          />
                          
                          {match.status === 'completed' && !match.rating && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => openRatingDialog(match)}
                              startIcon={<StarIcon />}
                            >
                              Bewerten
                            </Button>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </TabPanel>

      {/* Requests Tab */}
      <TabPanel value={currentTab} index={2}>
        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={3}>
          {/* Incoming Requests */}
          <Box sx={{ flex: '1 1 0' }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Eingehende Anfragen ({incomingRequests.length})
                </Typography>
                {isLoadingRequests && <LinearProgress sx={{ mb: 2 }} />}
                <List>
                  {incomingRequests.map((request: any) => (
                    <ListItem key={request.matchId}>
                      <ListItemAvatar>
                        <Avatar>
                          {request.requesterName?.[0] || 'S'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={request.requesterName}
                        secondary={request.skillName}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleAcceptMatch(request.matchId)}
                          color="success"
                        >
                          <CheckIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          onClick={() => handleRejectMatch(request.matchId)}
                          color="error"
                        >
                          <CloseIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Box>

          {/* Outgoing Requests */}
          <Box sx={{ flex: '1 1 0' }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Ausgehende Anfragen ({outgoingRequests.length})
                </Typography>
                <List>
                  {outgoingRequests.map((request: any) => (
                    <ListItem key={request.matchId}>
                      <ListItemAvatar>
                        <Avatar>
                          {request.requesterName?.[0] || 'R'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={request.requesterName}
                        secondary={request.skillName}
                      />
                      <ListItemSecondaryAction>
                        <Chip
                          label={request.status}
                          color={getStatusColor(request.status) as any}
                          size="small"
                        />
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </TabPanel>

      {/* Rating Dialog */}
      <Dialog open={ratingDialogOpen} onClose={() => setRatingDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Match bewerten</DialogTitle>
        <DialogContent>
          <Box textAlign="center" mb={3}>
            <Typography variant="h6" gutterBottom>
              Wie war der Skill-Tausch?
            </Typography>
            <Rating
              value={rating}
              onChange={(_event, newValue) => setRating(newValue || 0)}
              size="large"
            />
          </Box>
          <TextField
            label="Feedback (optional)"
            multiline
            rows={3}
            fullWidth
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Teile deine Erfahrung mit..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRatingDialogOpen(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleRateMatch} variant="contained" disabled={rating === 0}>
            Bewerten
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default EnhancedMatchmakingPage;