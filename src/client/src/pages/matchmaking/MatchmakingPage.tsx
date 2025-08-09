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
  Paper,
  Divider,
  Collapse,
  Grid,
  Stack,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Send as SendIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Psychology as PsychologyIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Message as MessageIcon,
  Reply as ReplyIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/store.hooks';
import {
  fetchIncomingMatchRequests,
  fetchOutgoingMatchRequests,
  acceptMatchRequest,
  rejectMatchRequest,
  createMatchRequest,
  getUserMatches,
} from '../../features/matchmaking/matchmakingSlice';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/layout/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import MatchingErrorBoundary from '../../components/error/MatchingErrorBoundary';
import errorService from '../../services/errorService';

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

interface RequestThread {
  threadId: string;
  otherUser: {
    id: string;
    name: string;
    avatar?: string;
  };
  skill: {
    id: string;
    name: string;
    category?: string;
  };
  requests: Array<{
    id: string;
    type: 'incoming' | 'outgoing';
    status: 'pending' | 'accepted' | 'rejected' | 'counter';
    message: string;
    createdAt: string;
    updatedAt?: string;
    isCounterOffer?: boolean;
    originalRequestId?: string;
  }>;
  latestRequest: {
    id: string;
    status: 'pending' | 'accepted' | 'rejected' | 'counter';
    createdAt: string;
    type: 'incoming' | 'outgoing';
  };
  unreadCount: number;
}

const MatchmakingPage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [counterOfferDialog, setCounterOfferDialog] = useState(false);
  const [counterOfferMessage, setCounterOfferMessage] = useState('');

  const dispatch = useAppDispatch();
  const {
    matches,
    incomingRequests,
    outgoingRequests,
    isLoading,
    isLoadingRequests,
    error,
  } = useAppSelector((state) => state.matchmaking);

  // Safe arrays with fallbacks
  const matchesArray = Array.isArray(matches) ? matches : [];
  const incomingRequestsArray = Array.isArray(incomingRequests) ? incomingRequests : [];
  const outgoingRequestsArray = Array.isArray(outgoingRequests) ? outgoingRequests : [];

  useEffect(() => {
    // Load initial data
    errorService.addBreadcrumb('Loading matchmaking page data', 'navigation');
    dispatch(getUserMatches({}));
    dispatch(fetchIncomingMatchRequests({}));
    dispatch(fetchOutgoingMatchRequests({}));
  }, [dispatch]);

  // Group requests into threads by user + skill
  const groupRequestsIntoThreads = (incoming: any[], outgoing: any[]): RequestThread[] => {
    const threadsMap = new Map<string, RequestThread>();

    // Process incoming requests
    incoming.forEach((request) => {
      // ✅ KORRIGIERT: Verwende echte ThreadId aus Backend anstatt generierte threadKey
      const threadId = request.threadId || `${request.requesterId}-${request.skillId}`;
      if (!threadsMap.has(threadId)) {
        threadsMap.set(threadId, {
          threadId: threadId,
          otherUser: {
            id: request.requesterId,
            name: request.requesterName || 'Unbekannter Nutzer',
          },
          skill: {
            id: request.skillId,
            name: request.skillName || 'Unbekannter Skill',
          },
          requests: [],
          latestRequest: {
            id: request.matchId,
            status: request.status,
            createdAt: request.createdAt,
            type: 'incoming',
          },
          unreadCount: 0,
        });
      }

      const thread = threadsMap.get(threadId)!;
      thread.requests.push({
        id: request.matchId,
        type: 'incoming',
        status: request.status,
        message: request.message || 'Neue Match-Anfrage',
        createdAt: request.createdAt,
      });

      // Update latest if this is newer
      if (new Date(request.createdAt) > new Date(thread.latestRequest.createdAt)) {
        thread.latestRequest = {
          id: request.matchId,
          status: request.status,
          createdAt: request.createdAt,
          type: 'incoming',
        };
      }

      if (request.status === 'pending') {
        thread.unreadCount++;
      }
    });

    // Process outgoing requests
    outgoing.forEach((request) => {
      // ✅ KORRIGIERT: Verwende echte ThreadId aus Backend anstatt generierte threadKey
      const threadId = request.threadId || `${request.targetUserId}-${request.skillId}`;
      if (!threadsMap.has(threadId)) {
        threadsMap.set(threadId, {
          threadId: threadId,
          otherUser: {
            id: request.targetUserId,
            name: request.targetUserName || 'Unbekannter Nutzer',
          },
          skill: {
            id: request.skillId,
            name: request.skillName || 'Unbekannter Skill',
          },
          requests: [],
          latestRequest: {
            id: request.matchId,
            status: request.status,
            createdAt: request.createdAt,
            type: 'outgoing',
          },
          unreadCount: 0,
        });
      }

      const thread = threadsMap.get(threadId)!;
      thread.requests.push({
        id: request.matchId,
        type: 'outgoing',
        status: request.status,
        message: request.message || 'Match-Anfrage gesendet',
        createdAt: request.createdAt,
      });

      // Update latest if this is newer
      if (new Date(request.createdAt) > new Date(thread.latestRequest.createdAt)) {
        thread.latestRequest = {
          id: request.matchId,
          status: request.status,
          createdAt: request.createdAt,
          type: 'outgoing',
        };
      }
    });

    // Sort by latest activity
    return Array.from(threadsMap.values()).sort(
      (a, b) => new Date(b.latestRequest.createdAt).getTime() - new Date(a.latestRequest.createdAt).getTime()
    );
  };

  // Separate threads by type
  const allThreads = groupRequestsIntoThreads(incomingRequestsArray, outgoingRequestsArray);
  const incomingThreads = allThreads.filter(thread => 
    thread.latestRequest.type === 'incoming' && thread.latestRequest.status === 'pending'
  );
  const outgoingThreads = allThreads.filter(thread => 
    thread.latestRequest.type === 'outgoing' || thread.latestRequest.status !== 'pending'
  );

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    errorService.addBreadcrumb('Changing matchmaking tab', 'ui', { tabIndex: newValue });
    setCurrentTab(newValue);
  };

  const handleExpandThread = (threadId: string) => {
    errorService.addBreadcrumb('Expanding/collapsing match thread', 'ui', { threadId });
    const newExpanded = new Set(expandedThreads);
    if (newExpanded.has(threadId)) {
      newExpanded.delete(threadId);
    } else {
      newExpanded.add(threadId);
    }
    setExpandedThreads(newExpanded);
  };

  const handleAcceptRequest = async (requestId: string, message?: string) => {
    try {
      errorService.addBreadcrumb('Accepting match request', 'action', { requestId });
      await dispatch(acceptMatchRequest({ requestId, responseMessage: message }));
      errorService.addBreadcrumb('Match request accepted successfully', 'action', { requestId });
      setResponseDialogOpen(false);
      setResponseMessage('');
      setSelectedRequest(null);
      // Refresh data
      dispatch(getUserMatches({}));
      dispatch(fetchIncomingMatchRequests({}));
      dispatch(fetchOutgoingMatchRequests({}));
    } catch (error) {
      errorService.addBreadcrumb('Error accepting match request', 'error', { 
        requestId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      console.error('Error accepting request:', error);
    }
  };

  const handleRejectRequest = async (requestId: string, message?: string) => {
    try {
      errorService.addBreadcrumb('Rejecting match request', 'action', { requestId });
      await dispatch(rejectMatchRequest({ requestId, responseMessage: message }));
      errorService.addBreadcrumb('Match request rejected successfully', 'action', { requestId });
      setResponseDialogOpen(false);
      setResponseMessage('');
      setSelectedRequest(null);
      // Refresh data
      dispatch(getUserMatches({}));
      dispatch(fetchIncomingMatchRequests({}));
      dispatch(fetchOutgoingMatchRequests({}));
    } catch (error) {
      errorService.addBreadcrumb('Error rejecting match request', 'error', { 
        requestId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      console.error('Error rejecting request:', error);
    }
  };

  const handleCounterOffer = async () => {
    if (selectedRequest && counterOfferMessage.trim()) {
      try {
        errorService.addBreadcrumb('Creating counter offer', 'action', { 
          originalRequestId: selectedRequest.id,
          skillId: selectedRequest.skillId 
        });
        // Create a new request as counter-offer
        await dispatch(createMatchRequest({
          skillId: selectedRequest.skillId,
          message: `Gegenangebot: ${counterOfferMessage.trim()}`,
          targetUserId: selectedRequest.otherUserId, // Counter-offer zurück an den ursprünglichen Requester
        }));
        errorService.addBreadcrumb('Counter offer created successfully', 'action', { 
          originalRequestId: selectedRequest.id 
        });
        setCounterOfferDialog(false);
        setCounterOfferMessage('');
        setSelectedRequest(null);
        // Refresh data
        dispatch(getUserMatches({}));
        dispatch(fetchIncomingMatchRequests({}));
        dispatch(fetchOutgoingMatchRequests({}));
      } catch (error) {
        errorService.addBreadcrumb('Error creating counter offer', 'error', { 
          originalRequestId: selectedRequest.id,
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        console.error('Error creating counter-offer:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      case 'counter': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string, type: 'incoming' | 'outgoing') => {
    switch (status) {
      case 'accepted': return <CheckIcon color="success" />;
      case 'rejected': return <CloseIcon color="error" />;
      case 'pending': 
        return type === 'incoming' ? <PersonAddIcon color="warning" /> : <SendIcon color="warning" />;
      default: return <MessageIcon />;
    }
  };

  const handleRefresh = () => {
    errorService.addBreadcrumb('Refreshing matchmaking data', 'action');
    dispatch(getUserMatches({}));
    dispatch(fetchIncomingMatchRequests({}));
    dispatch(fetchOutgoingMatchRequests({}));
  };

  if (isLoading && incomingRequestsArray.length === 0 && outgoingRequestsArray.length === 0 && matchesArray.length === 0) {
    return <LoadingSpinner fullPage message="Lade Match-Anfragen..." />;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Match-Anfragen"
        subtitle="Verwalte deine eingehenden und ausgehenden Skill-Anfragen"
        icon={<PsychologyIcon />}
        actions={
          <Box display="flex" gap={1}>
            <IconButton onClick={handleRefresh} disabled={isLoadingRequests}>
              <RefreshIcon />
            </IconButton>
          </Box>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Fehler beim Laden der Matches: {typeof error === 'string' ? error : error.message || 'Ein unbekannter Fehler ist aufgetreten'}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {matchesArray.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Bestätigte Matches
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main">
                {incomingThreads.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Eingehende Anfragen
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="success.main">
                {allThreads.filter(t => t.latestRequest.status === 'accepted').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Akzeptiert
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" color="info.main">
                {allThreads.reduce((sum, thread) => sum + thread.unreadCount, 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ungelesen
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Tabs value={currentTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab
              label={
                <Box display="flex" alignItems="center">
                  <PersonAddIcon sx={{ mr: 1 }} />
                  Eingehende Anfragen
                  {incomingThreads.length > 0 && (
                    <Badge badgeContent={incomingThreads.length} color="warning" sx={{ ml: 1 }} />
                  )}
                </Box>
              }
            />
            <Tab
              label={
                <Box display="flex" alignItems="center">
                  <SendIcon sx={{ mr: 1 }} />
                  Ausgehende Anfragen
                  {outgoingThreads.length > 0 && (
                    <Badge badgeContent={outgoingThreads.length} color="primary" sx={{ ml: 1 }} />
                  )}
                </Box>
              }
            />
            <Tab
              label={
                <Box display="flex" alignItems="center">
                  <CheckIcon sx={{ mr: 1 }} />
                  Matches
                  {matchesArray.length > 0 && (
                    <Badge badgeContent={matchesArray.length} color="success" sx={{ ml: 1 }} />
                  )}
                </Box>
              }
            />
          </Tabs>
        </CardContent>
      </Card>

      {/* Incoming Requests Tab */}
      <TabPanel value={currentTab} index={0}>
        <Box>
          {incomingThreads.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <PersonAddIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Keine eingehenden Anfragen
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Du hast derzeit keine ausstehenden Match-Anfragen.
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {incomingThreads.map((thread) => (
                <Card key={thread.threadId} variant="outlined">
                  <CardContent>
                    {/* Thread Header */}
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                      <Box display="flex" alignItems="center" flex={1}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {thread.otherUser.name[0] || 'U'}
                        </Avatar>
                        <Box flex={1}>
                          <Typography variant="h6">
                            {thread.otherUser.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {thread.skill.name}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                            <AccessTimeIcon fontSize="small" color="action" />
                            <Typography variant="caption" color="text.secondary">
                              {formatDistanceToNow(new Date(thread.latestRequest.createdAt), { 
                                addSuffix: true, 
                                locale: de 
                              })}
                            </Typography>
                            {thread.unreadCount > 0 && (
                              <Chip 
                                label={`${thread.unreadCount} neu`} 
                                size="small" 
                                color="warning" 
                              />
                            )}
                          </Box>
                        </Box>
                      </Box>
                      
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          label={thread.latestRequest.status}
                          color={getStatusColor(thread.latestRequest.status) as any}
                          size="small"
                        />
                        <IconButton
                          onClick={() => handleExpandThread(thread.threadId)}
                          size="small"
                        >
                          {expandedThreads.has(thread.threadId) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Quick Actions */}
                    {thread.latestRequest.status === 'pending' && (
                      <Box display="flex" gap={1} mb={2}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CheckIcon />}
                          onClick={() => handleAcceptRequest(thread.latestRequest.id)}
                        >
                          Akzeptieren
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<CloseIcon />}
                          onClick={() => handleRejectRequest(thread.latestRequest.id)}
                        >
                          Ablehnen
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="info"
                          startIcon={<ReplyIcon />}
                          onClick={() => {
                            setSelectedRequest({ 
                              ...thread.latestRequest, 
                              requesterId: thread.otherUser.id,
                              skillId: thread.skill.id 
                            });
                            setCounterOfferDialog(true);
                          }}
                        >
                          Gegenangebot
                        </Button>
                      </Box>
                    )}

                    {/* Request History */}
                    <Collapse in={expandedThreads.has(thread.threadId)}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Anfrage-Verlauf
                      </Typography>
                      <Stack spacing={2} sx={{ mt: 2 }}>
                        {thread.requests
                          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                          .map((request) => (
                          <Paper key={request.id} variant="outlined" sx={{ p: 2 }}>
                            <Box display="flex" alignItems="center" gap={2}>
                              <Avatar 
                                sx={{ 
                                  bgcolor: `${getStatusColor(request.status)}.main`,
                                  width: 32,
                                  height: 32 
                                }}
                              >
                                {getStatusIcon(request.status, request.type)}
                              </Avatar>
                              <Box flex={1}>
                                <Typography variant="subtitle2">
                                  {request.type === 'incoming' ? 'Anfrage erhalten' : 'Antwort gesendet'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {request.message}
                                </Typography>
                                <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                  <AccessTimeIcon fontSize="small" color="action" />
                                  <Typography variant="caption" color="text.secondary">
                                    {formatDistanceToNow(new Date(request.createdAt), { 
                                      addSuffix: true, 
                                      locale: de 
                                    })}
                                  </Typography>
                                  <Chip 
                                    label={request.status} 
                                    size="small" 
                                    color={getStatusColor(request.status) as any}
                                  />
                                </Box>
                              </Box>
                            </Box>
                          </Paper>
                        ))}
                      </Stack>
                    </Collapse>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Box>
      </TabPanel>

      {/* Outgoing Requests Tab */}
      <TabPanel value={currentTab} index={1}>
        <Box>
          {outgoingThreads.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <SendIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Keine ausgehenden Anfragen
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Du hast noch keine Match-Anfragen gesendet.
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {outgoingThreads.map((thread) => (
                <Card key={thread.threadId} variant="outlined">
                  <CardContent>
                    {/* Thread Header */}
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                      <Box display="flex" alignItems="center" flex={1}>
                        <Avatar sx={{ mr: 2, bgcolor: 'secondary.main' }}>
                          {thread.otherUser.name[0] || 'U'}
                        </Avatar>
                        <Box flex={1}>
                          <Typography variant="h6">
                            {thread.otherUser.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {thread.skill.name}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                            <AccessTimeIcon fontSize="small" color="action" />
                            <Typography variant="caption" color="text.secondary">
                              {formatDistanceToNow(new Date(thread.latestRequest.createdAt), { 
                                addSuffix: true, 
                                locale: de 
                              })}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          label={thread.latestRequest.status}
                          color={getStatusColor(thread.latestRequest.status) as any}
                          size="small"
                        />
                        <IconButton
                          onClick={() => handleExpandThread(thread.threadId)}
                          size="small"
                        >
                          {expandedThreads.has(thread.threadId) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Request History */}
                    <Collapse in={expandedThreads.has(thread.threadId)}>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Anfrage-Verlauf
                      </Typography>
                      <Stack spacing={2} sx={{ mt: 2 }}>
                        {thread.requests
                          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                          .map((request) => (
                          <Paper key={request.id} variant="outlined" sx={{ p: 2 }}>
                            <Box display="flex" alignItems="center" gap={2}>
                              <Avatar 
                                sx={{ 
                                  bgcolor: `${getStatusColor(request.status)}.main`,
                                  width: 32,
                                  height: 32 
                                }}
                              >
                                {getStatusIcon(request.status, request.type)}
                              </Avatar>
                              <Box flex={1}>
                                <Typography variant="subtitle2">
                                  {request.type === 'outgoing' ? 'Anfrage gesendet' : 'Antwort erhalten'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {request.message}
                                </Typography>
                                <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                  <AccessTimeIcon fontSize="small" color="action" />
                                  <Typography variant="caption" color="text.secondary">
                                    {formatDistanceToNow(new Date(request.createdAt), { 
                                      addSuffix: true, 
                                      locale: de 
                                    })}
                                  </Typography>
                                  <Chip 
                                    label={request.status} 
                                    size="small" 
                                    color={getStatusColor(request.status) as any}
                                  />
                                </Box>
                              </Box>
                            </Box>
                          </Paper>
                        ))}
                      </Stack>
                    </Collapse>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Box>
      </TabPanel>

      {/* Matches Tab */}
      <TabPanel value={currentTab} index={2}>
        <Box>
          {matchesArray.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <CheckIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Keine Matches
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Du hast noch keine bestätigten Skill-Matches.
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={2}>
              {matchesArray.map((match) => (
                <Card key={match.id} variant="outlined">
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                      <Box display="flex" alignItems="center" flex={1}>
                        <Avatar sx={{ mr: 2, bgcolor: 'success.main' }}>
                          <CheckIcon />
                        </Avatar>
                        <Box flex={1}>
                          <Typography variant="h6">
                            {match.skill?.name || match.skillName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {match.isOffering ? 'Du bietest an' : 'Du lernst'}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                            <AccessTimeIcon fontSize="small" color="action" />
                            <Typography variant="caption" color="text.secondary">
                              {formatDistanceToNow(new Date(match.createdAt), { 
                                addSuffix: true, 
                                locale: de 
                              })}
                            </Typography>
                            {match.acceptedAt && (
                              <>
                                <Typography variant="caption" color="text.secondary">
                                  • Bestätigt 
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatDistanceToNow(new Date(match.acceptedAt), { 
                                    addSuffix: true, 
                                    locale: de 
                                  })}
                                </Typography>
                              </>
                            )}
                          </Box>
                        </Box>
                      </Box>
                      
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          label={match.status}
                          color="success"
                          size="small"
                        />
                        <Typography variant="body2" color="success.main">
                          {((match.compatibilityScore || 0) * 100).toFixed(0)}% Match
                        </Typography>
                      </Box>
                    </Box>

                    <Box display="flex" gap={1}>
                      <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        startIcon={<MessageIcon />}
                      >
                        Nachricht senden
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                      >
                        Details ansehen
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Box>
      </TabPanel>

      {/* Counter Offer Dialog */}
      <Dialog open={counterOfferDialog} onClose={() => setCounterOfferDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Gegenangebot erstellen</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Erstelle ein Gegenangebot mit deinen eigenen Vorschlägen für Zeit, Ort oder andere Details.
          </Typography>
          <TextField
            label="Dein Gegenangebot"
            multiline
            rows={4}
            fullWidth
            value={counterOfferMessage}
            onChange={(e) => setCounterOfferMessage(e.target.value)}
            placeholder="Z.B.: Ich würde gerne dienstags und donnerstags von 18-20 Uhr..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCounterOfferDialog(false)}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleCounterOffer} 
            variant="contained" 
            disabled={!counterOfferMessage.trim()}
            startIcon={<ReplyIcon />}
          >
            Gegenangebot senden
          </Button>
        </DialogActions>
      </Dialog>

      {/* Response Dialog */}
      <Dialog open={responseDialogOpen} onClose={() => setResponseDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Anfrage bearbeiten</DialogTitle>
        <DialogContent>
          <TextField
            label="Nachricht (optional)"
            multiline
            rows={3}
            fullWidth
            value={responseMessage}
            onChange={(e) => setResponseMessage(e.target.value)}
            placeholder="Füge eine persönliche Nachricht hinzu..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResponseDialogOpen(false)}>
            Abbrechen
          </Button>
          <Button 
            onClick={() => handleRejectRequest(selectedRequest?.id, responseMessage)}
            color="error"
            startIcon={<CloseIcon />}
          >
            Ablehnen
          </Button>
          <Button 
            onClick={() => handleAcceptRequest(selectedRequest?.id, responseMessage)}
            variant="contained" 
            color="success"
            startIcon={<CheckIcon />}
          >
            Akzeptieren
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

const WrappedMatchmakingPage: React.FC = () => (
  <MatchingErrorBoundary>
    <MatchmakingPage />
  </MatchingErrorBoundary>
);

export default WrappedMatchmakingPage;