// src/client/src/pages/matchmaking/MatchRequestsOverviewPage.tsx
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
  Grid,
  Paper,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  // Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  PersonAdd as PersonAddIcon,
  Send as SendIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  SwapHoriz as SwapIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
  LocalOffer as OfferIcon,
  School as LearnIcon,
  Timeline as TimelineIcon,
  Message as MessageIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/store.hooks';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/layout/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchIncomingMatchRequests, fetchOutgoingMatchRequests, acceptMatchRequest, rejectMatchRequest } from '../../features/matchmaking/matchmakingSlice';

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

interface MatchRequestCardProps {
  request: any;
  onAccept?: () => void;
  onReject?: () => void;
  onCounter?: () => void;
  onViewTimeline?: () => void;
}

const MatchRequestCard: React.FC<MatchRequestCardProps> = ({
  request,
  onAccept,
  onReject,
  onCounter,
  onViewTimeline,
}) => {
  const getStatusColor = () => {
    switch (request?.status) {
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'error';
      case 'countered':
        return 'warning';
      default:
        return 'primary';
    }
  };

  const getOfferTypeIcon = () => {
    if (request?.isSkillExchange) return <SwapIcon />;
    if (request?.isMonetary) return <MoneyIcon />;
    return <MessageIcon />;
  };

  if (!request) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        sx={{
          height: '100%',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 4,
          },
          cursor: 'pointer',
        }}
        onClick={onViewTimeline}
      >
        <CardContent>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar src={request.user?.avatar} sx={{ width: 48, height: 48 }}>
                {request.user?.name?.[0] || 'U'}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight="medium">
                  {request.user?.name || 'Unbekannter Nutzer'}
                </Typography>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <StarIcon fontSize="small" sx={{ color: 'warning.main' }} />
                  <Typography variant="body2" color="text.secondary">
                    {request.user?.rating || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              {!request.isRead && (
                <Badge color="error" variant="dot">
                  <Typography variant="caption" color="error">
                    NEU
                  </Typography>
                </Badge>
              )}
              <Chip
                label={request.status || 'unknown'}
                size="small"
                color={getStatusColor()}
                variant="outlined"
              />
            </Box>
          </Box>

          {/* Skill Info */}
          <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: 'background.default' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center" gap={1}>
                {request.skill?.isOffered ? (
                  <OfferIcon fontSize="small" color="primary" />
                ) : (
                  <LearnIcon fontSize="small" color="secondary" />
                )}
                <Typography variant="body2" fontWeight="medium">
                  {request.skill?.name || 'Unbekannter Skill'}
                </Typography>
              </Box>
              <Chip
                label={request.skill?.category || 'Unbekannt'}
                size="small"
                variant="outlined"
              />
            </Box>
          </Paper>

          {/* Offer Type */}
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              {getOfferTypeIcon()}
              <Typography variant="body2">
                {request.isSkillExchange
                  ? `Tausch gegen: ${request.exchangeSkill?.name || 'Unbekannt'}`
                  : request.isMonetary
                  ? `Angebot: ${request.offeredAmount || 0}€/Session`
                  : 'Standard-Anfrage'}
              </Typography>
            </Box>
          </Box>

          {/* Schedule Summary */}
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <ScheduleIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {request.totalSessions || 0} Sessions á {request.sessionDuration || 0} Min.
            </Typography>
          </Box>

          {/* Time Info */}
          <Typography variant="caption" color="text.secondary">
            {request.createdAt 
              ? formatDistanceToNow(new Date(request.createdAt), {
                  addSuffix: true,
                  locale: de,
                })
              : 'Unbekanntes Datum'
            }
          </Typography>

          {/* Actions */}
          {request.status === 'pending' && request.type === 'incoming' && (
            <Box display="flex" gap={1} mt={2} onClick={(e) => e.stopPropagation()}>
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<CheckIcon />}
                onClick={onAccept}
                fullWidth
              >
                Annehmen
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="warning"
                startIcon={<SwapIcon />}
                onClick={onCounter}
                fullWidth
              >
                Gegenangebot
              </Button>
              <IconButton
                size="small"
                color="error"
                onClick={onReject}
                sx={{ border: 1, borderColor: 'error.main' }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          )}

          {/* View Timeline Button for other statuses */}
          {(request.status !== 'pending' || request.type === 'outgoing') && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<TimelineIcon />}
              onClick={onViewTimeline}
              fullWidth
              sx={{ mt: 2 }}
            >
              Timeline ansehen
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

interface MatchRequestsOverviewPageProps {
  embedded?: boolean; // Wenn true, wird keine PageContainer/PageHeader gerendert
}

const MatchRequestsOverviewPage: React.FC<MatchRequestsOverviewPageProps> = ({ embedded = false }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [_sortBy, setSortBy] = useState('newest');
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);

  // const { user } = useAppSelector((state) => state.auth); // Removed unused variable
  const { incomingRequests, outgoingRequests, isLoadingRequests } = useAppSelector((state) => state.matchmaking);

  // Load requests on component mount
  useEffect(() => {
    dispatch(fetchIncomingMatchRequests({}));
    dispatch(fetchOutgoingMatchRequests({}));
  }, [dispatch]);

  // Safely handle potentially null/undefined arrays with proper null checks
  const safeIncomingRequests = incomingRequests || [];
  const safeOutgoingRequests = outgoingRequests || [];

  // Calculate dynamic stats based on real data - nur pending requests zählen für aktive Anfragen
  const pendingIncomingRequests = safeIncomingRequests.filter(r => r?.status !== 'accepted');
  const pendingOutgoingRequests = safeOutgoingRequests.filter(r => r?.status !== 'accepted');
  const acceptedRequests = [...safeIncomingRequests, ...safeOutgoingRequests].filter(r => r?.status === 'accepted');
  
  const stats = {
    totalRequests: (pendingIncomingRequests?.length || 0) + (pendingOutgoingRequests?.length || 0),
    pendingRequests: (pendingIncomingRequests?.filter(r => r?.status === 'pending')?.length || 0) + 
                    (pendingOutgoingRequests?.filter(r => r?.status === 'pending')?.length || 0),
    acceptedRequests: acceptedRequests?.length || 0,
    successRate: Math.round(((acceptedRequests?.length || 0) / Math.max(1, (safeIncomingRequests?.length || 0) + (safeOutgoingRequests?.length || 0))) * 100),
  };

  const getRequestsByTab = () => {
    switch (activeTab) {
      case 0:
        // Nur pending eingehende Anfragen anzeigen (akzeptierte werden zu Matches)
        return pendingIncomingRequests || [];
      case 1:
        // Nur pending ausgehende Anfragen anzeigen (akzeptierte werden zu Matches)
        return pendingOutgoingRequests || [];
      default:
        return [];
    }
  };

  const handleAcceptRequest = (requestId: string) => {
    if (requestId) {
      dispatch(acceptMatchRequest({ requestId }));
    }
  };

  const handleRejectRequest = (requestId: string) => {
    if (requestId) {
      dispatch(rejectMatchRequest({ requestId }));
    }
  };

  const handleCounterRequest = (requestId: string) => {
    if (requestId) {
      console.log('Counter offer for request:', requestId);
      // Navigate to counter offer dialog or open modal
    }
  };

  const handleViewTimeline = (threadId: string) => {
    if (threadId) {
      navigate(`/matchmaking/timeline/${threadId}`);
    } else {
      console.warn('No threadId available for timeline navigation');
    }
  };

  const handleRefresh = () => {
    dispatch(fetchIncomingMatchRequests({}));
    dispatch(fetchOutgoingMatchRequests({}));
  };

  if (isLoadingRequests) {
    return <LoadingSpinner fullPage message="Lade Match-Anfragen..." />;
  }

  const currentRequests = getRequestsByTab();

  const content = (
    <>
      {!embedded && (
        <PageHeader
          title="Match-Anfragen"
          subtitle="Verwalte deine Skill-Tausch-Anfragen"
          icon={<SwapIcon />}
          actions={
            <Box display="flex" gap={1}>
              <Tooltip title="Aktualisieren">
                <IconButton onClick={handleRefresh}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => navigate('/skills')}
              >
                Neue Anfrage
              </Button>
            </Box>
          }
        />
      )}

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4">{stats.totalRequests}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Gesamt-Anfragen
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'primary.light' }}>
                <MessageIcon />
              </Avatar>
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4">{stats.pendingRequests}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Ausstehend
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'warning.light' }}>
                <ScheduleIcon />
              </Avatar>
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4">{stats.acceptedRequests}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Zu Matches
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'success.light' }}>
                <CheckIcon />
              </Avatar>
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h4">{stats.successRate}%</Typography>
                <Typography variant="body2" color="text.secondary">
                  Erfolgsrate
                </Typography>
              </Box>
              <Avatar sx={{ bgcolor: 'info.light' }}>
                <TrendingIcon />
              </Avatar>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Main Content Card */}
      <Card>
        <CardContent>
          {/* Search and Filter Bar */}
          <Box display="flex" gap={2} mb={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Suche nach Skills oder Nutzern..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
            >
              Filter
            </Button>
            <Button
              variant="outlined"
              startIcon={<SortIcon />}
              onClick={(e) => setSortMenuAnchor(e.currentTarget)}
            >
              Sortieren
            </Button>
          </Box>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
          >
            <Tab
              label={
                <Badge badgeContent={pendingIncomingRequests?.length || 0} color="primary">
                  Eingehend
                </Badge>
              }
              icon={<PersonAddIcon />}
              iconPosition="start"
            />
            <Tab
              label={
                <Badge badgeContent={pendingOutgoingRequests?.length || 0} color="secondary">
                  Ausgehend
                </Badge>
              }
              icon={<SendIcon />}
              iconPosition="start"
            />
          </Tabs>

          {/* Tab Panels */}
          <TabPanel value={activeTab} index={0}>
            {!currentRequests || currentRequests.length === 0 ? (
              <EmptyState
                icon={<PersonAddIcon sx={{ fontSize: 64 }} />}
                title="Keine eingehenden Anfragen"
                description={'Du hast aktuell keine offenen Match-Anfragen erhalten.'}
              />
            ) : (
              <Grid container spacing={3}>
                <AnimatePresence>
                  {currentRequests.map((request) => (
                    request && request.id ? (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={request.id}>
                        <MatchRequestCard
                          request={request}
                          onAccept={() => handleAcceptRequest(request.id)}
                          onReject={() => handleRejectRequest(request.id)}
                          onCounter={() => handleCounterRequest(request.id)}
                          onViewTimeline={() => handleViewTimeline(request.threadId || request.id)}
                        />
                      </Grid>
                    ) : null
                  ))}
                </AnimatePresence>
              </Grid>
            )}
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            {!currentRequests || currentRequests.length === 0 ? (
              <EmptyState
                icon={<SendIcon sx={{ fontSize: 64 }} />}
                title="Keine ausgehenden Anfragen"
                description={'Du hast noch keine Match-Anfragen gesendet.'}
                actionLabel="Skills durchsuchen"
                actionHandler={() => navigate('/skills')}
              />
            ) : (
              <Grid container spacing={3}>
                <AnimatePresence>
                  {currentRequests.map((request) => (
                    request && request.id ? (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={request.id}>
                        <MatchRequestCard
                          request={request}
                          onViewTimeline={() => handleViewTimeline(request.threadId || request.id)}
                        />
                      </Grid>
                    ) : null
                  ))}
                </AnimatePresence>
              </Grid>
            )}
          </TabPanel>

        </CardContent>
      </Card>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={() => setFilterMenuAnchor(null)}
      >
        <MenuItem>
          <ListItemIcon>
            <SwapIcon />
          </ListItemIcon>
          <ListItemText>Nur Skill-Tausch</ListItemText>
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <MoneyIcon />
          </ListItemIcon>
          <ListItemText>Nur bezahlte Anfragen</ListItemText>
        </MenuItem>
        <MenuItem divider>
          <ListItemIcon>
            <StarIcon />
          </ListItemIcon>
          <ListItemText>Bewertung über 4.5</ListItemText>
        </MenuItem>
     </Menu>

     {/* Sort Menu */}
     <Menu
       anchorEl={sortMenuAnchor}
       open={Boolean(sortMenuAnchor)}
       onClose={() => setSortMenuAnchor(null)}
     >
       <MenuItem onClick={() => setSortBy('newest')}>
         <ListItemText>Neueste zuerst</ListItemText>
       </MenuItem>
       <MenuItem onClick={() => setSortBy('oldest')}>
         <ListItemText>Älteste zuerst</ListItemText>
       </MenuItem>
       <MenuItem onClick={() => setSortBy('rating')}>
         <ListItemText>Nach Bewertung</ListItemText>
       </MenuItem>
       <MenuItem onClick={() => setSortBy('sessions')}>
         <ListItemText>Nach Anzahl Sessions</ListItemText>
       </MenuItem>
     </Menu>
    </>
  );

  return embedded ? content : <PageContainer>{content}</PageContainer>;
};

export default MatchRequestsOverviewPage;