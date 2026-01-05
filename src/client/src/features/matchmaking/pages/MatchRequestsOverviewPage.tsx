import React, { useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import { useAppSelector } from '../../../core/store/store.hooks';
import PageContainer from '../../../shared/components/layout/PageContainer';
import PageHeader from '../../../shared/components/layout/PageHeader';
import EmptyState from '../../../shared/components/ui/EmptyState';
import { LoadingButton } from '../../../shared/components/ui/LoadingButton';
import LoadingSpinner from '../../../shared/components/ui/LoadingSpinner';
import useToast from '../../../shared/hooks/useToast';
import useMatchmaking from '../hooks/useMatchmaking';
import type { TabPanelProps } from '../../../shared/types/components/LayoutProps';
import type {
  MatchRequestDisplay,
  AcceptMatchRequestRequest,
  RejectMatchRequestRequest,
} from '../types/MatchmakingDisplay';

const TabPanel = (props: TabPanelProps): React.JSX.Element | null => {
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

interface MatchRequestCardProps {
  request: MatchRequestDisplay;
  onAccept?: () => void;
  onReject?: () => void;
  onCounter?: () => void;
  onViewTimeline?: () => void;
  isLoading?: boolean;
}

const MatchRequestCard: React.FC<MatchRequestCardProps> = ({
  request,
  onAccept,
  onReject,
  onCounter,
  onViewTimeline,
  isLoading = false,
}) => {
  const getStatusColor = (): 'success' | 'error' | 'warning' | 'primary' => {
    switch (request.status) {
      case 'accepted':
        return 'success';
      case 'rejected':
      case 'expired':
        return 'error';
      case 'counter':
        return 'warning';
      case 'pending':
        return 'primary';
      default: {
        const _exhaustiveCheck: never = request.status;
        return _exhaustiveCheck;
      }
    }
  };

  const getOfferTypeIcon = (): React.ReactNode => {
    if (request.isSkillExchange) return <SwapIcon />;
    if (request.isMonetary) return <MoneyIcon />;
    return <MessageIcon />;
  };

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
              <Avatar src={request.otherUserAvatar} sx={{ width: 48, height: 48 }}>
                {request.otherUserName[0]}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight="medium">
                  {request.otherUserName}
                </Typography>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <StarIcon fontSize="small" sx={{ color: 'warning.main' }} />
                  <Typography variant="body2" color="text.secondary">
                    {request.otherUserRating || 'N/A'}
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
                label={request.status}
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
                {request.type === 'outgoing' ? (
                  <LearnIcon fontSize="small" color="secondary" />
                ) : (
                  <OfferIcon fontSize="small" color="primary" />
                )}
                <Typography variant="body2" fontWeight="medium">
                  {request.skillName}
                </Typography>
              </Box>
              <Chip label={request.skillCategory} size="small" variant="outlined" />
            </Box>
          </Paper>

          {/* Offer Type */}
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              {getOfferTypeIcon()}
              <Typography variant="body2">
                {request.isSkillExchange
                  ? `Tausch gegen: ${request.exchangeSkillName ?? 'Unbekannter Skill'}`
                  : request.isMonetary
                    ? `Angebot: ${request.offeredAmount ?? 0}€/Session`
                    : 'Standard-Anfrage'}
              </Typography>
            </Box>
          </Box>

          {/* Schedule Summary */}
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <ScheduleIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {request.totalSessions || 0} Sessions á {request.sessionDurationMinutes || 0} Min.
            </Typography>
          </Box>

          {/* Time Info */}
          <Typography variant="caption" color="text.secondary">
            {request.createdAt
              ? formatDistanceToNow(new Date(request.createdAt), {
                  addSuffix: true,
                  locale: de,
                })
              : 'Unbekanntes Datum'}
          </Typography>

          {/* Actions */}
          {request.status === 'pending' && request.type === 'incoming' && (
            <Box
              display="flex"
              gap={1}
              mt={2}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <LoadingButton
                size="small"
                variant="contained"
                color="success"
                startIcon={<CheckIcon />}
                onClick={onAccept}
                loading={isLoading}
                disabled={isLoading}
                fullWidth
              >
                Annehmen
              </LoadingButton>
              <Button
                size="small"
                variant="outlined"
                color="warning"
                startIcon={<SwapIcon />}
                onClick={onCounter}
                disabled={isLoading}
                fullWidth
              >
                Gegenangebot
              </Button>
              <IconButton
                size="small"
                color="error"
                onClick={onReject}
                disabled={isLoading}
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

const MatchRequestsOverviewPage: React.FC<MatchRequestsOverviewPageProps> = ({
  embedded = false,
}) => {
  const navigate = useNavigate();
  const toast = useToast();
  const { acceptMatchRequest, rejectMatchRequest, loadIncomingRequests, loadOutgoingRequests } =
    useMatchmaking();

  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  void sortBy; // TODO: Implement sorting logic
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);
  const [loadingRequestIds, setLoadingRequestIds] = useState<Set<string>>(new Set());

  const { incomingRequests, outgoingRequests, isLoadingRequests } = useAppSelector(
    (state) => state.matchmaking
  );

  React.useEffect(() => {
    loadIncomingRequests();
    loadOutgoingRequests();
  }, [loadIncomingRequests, loadOutgoingRequests]);

  // Use arrays directly - Redux state always initializes as empty arrays
  const safeIncomingRequests = incomingRequests;
  const safeOutgoingRequests = outgoingRequests;

  // Calculate dynamic stats based on real data - nur pending requests zählen für aktive Anfragen
  const pendingIncomingRequests = safeIncomingRequests.filter((r) => r.status !== 'accepted');
  const pendingOutgoingRequests = safeOutgoingRequests.filter((r) => r.status !== 'accepted');
  const acceptedRequests = [...safeIncomingRequests, ...safeOutgoingRequests].filter(
    (r) => r.status === 'accepted'
  );

  const stats = {
    totalRequests: pendingIncomingRequests.length + pendingOutgoingRequests.length,
    pendingRequests:
      pendingIncomingRequests.filter((r) => r.status === 'pending').length +
      pendingOutgoingRequests.filter((r) => r.status === 'pending').length,
    acceptedRequests: acceptedRequests.length,
    successRate: Math.round(
      (acceptedRequests.length /
        Math.max(1, safeIncomingRequests.length + safeOutgoingRequests.length)) *
        100
    ),
  };

  const getRequestsByTab = (): MatchRequestDisplay[] => {
    switch (activeTab) {
      case 0:
        // Nur pending eingehende Anfragen anzeigen (akzeptierte werden zu Matches)
        return pendingIncomingRequests;
      case 1:
        // Nur pending ausgehende Anfragen anzeigen (akzeptierte werden zu Matches)
        return pendingOutgoingRequests;
      default:
        return [];
    }
  };

  // PERFORMANCE FIX: Wrap handlers in useCallback to prevent recreation on every render
  const handleAcceptRequest = useCallback(
    (requestId: string, _request: AcceptMatchRequestRequest): void => {
      if (!requestId) return;

      setLoadingRequestIds((prev) => new Set(prev).add(requestId));

      // These dispatch functions return void, not Promise
      // Success/error handling is done via Redux state
      acceptMatchRequest(requestId, _request);
      toast.success('Match-Anfrage akzeptiert! 🎉 Weiterleitung zum Dashboard...');

      // Clear loading state and navigate to dashboard after short delay
      setTimeout(() => {
        setLoadingRequestIds((prev) => {
          const next = new Set(prev);
          next.delete(requestId);
          return next;
        });
        void navigate('/dashboard');
      }, 1500);
    },
    [acceptMatchRequest, navigate, toast]
  );

  const handleRejectRequest = useCallback(
    (requestId: string, _request: RejectMatchRequestRequest): void => {
      if (!requestId) return;

      setLoadingRequestIds((prev) => new Set(prev).add(requestId));

      // These dispatch functions return void, not Promise
      // Success/error handling is done via Redux state
      rejectMatchRequest(requestId, _request);
      toast.warning('Match-Anfrage abgelehnt');

      // Clear loading state after a short delay
      setTimeout(() => {
        setLoadingRequestIds((prev) => {
          const next = new Set(prev);
          next.delete(requestId);
          return next;
        });
      }, 500);
    },
    [rejectMatchRequest, toast]
  );

  const handleCounterRequest = useCallback((requestId: string): void => {
    if (requestId) {
      console.debug('Counter offer for request:', requestId);
      // Navigate to counter offer dialog or open modal
    }
  }, []);

  const handleViewTimeline = useCallback(
    (threadId: string): void => {
      if (threadId) {
        void navigate(`/matchmaking/timeline/${threadId}`);
      } else {
        console.warn('No threadId available for timeline navigation');
      }
    },
    [navigate]
  );

  const handleRefresh = useCallback((): void => {
    loadIncomingRequests();
    loadOutgoingRequests();
  }, [loadIncomingRequests, loadOutgoingRequests]);

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
                onClick={() => {
                  void navigate('/skills');
                }}
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
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={(e) => {
                setFilterMenuAnchor(e.currentTarget);
              }}
            >
              Filter
            </Button>
            <Button
              variant="outlined"
              startIcon={<SortIcon />}
              onClick={(e) => {
                setSortMenuAnchor(e.currentTarget);
              }}
            >
              Sortieren
            </Button>
          </Box>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onChange={(_, newValue: number) => {
              setActiveTab(newValue);
            }}
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
          >
            <Tab
              label={
                <Badge badgeContent={pendingIncomingRequests.length} color="primary">
                  Eingehend
                </Badge>
              }
              icon={<PersonAddIcon />}
              iconPosition="start"
            />
            <Tab
              label={
                <Badge badgeContent={pendingOutgoingRequests.length} color="secondary">
                  Ausgehend
                </Badge>
              }
              icon={<SendIcon />}
              iconPosition="start"
            />
          </Tabs>

          {/* Tab Panels */}
          <TabPanel value={activeTab} index={0}>
            {currentRequests.length === 0 ? (
              <EmptyState
                icon={<PersonAddIcon sx={{ fontSize: 64 }} />}
                title="Keine eingehenden Anfragen"
                description="Du hast aktuell keine offenen Match-Anfragen erhalten."
              />
            ) : (
              <Grid container spacing={3}>
                <AnimatePresence>
                  {currentRequests.map((request) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={request.id}>
                      <MatchRequestCard
                        request={request}
                        onAccept={() => {
                          handleAcceptRequest(request.id, { responseMessage: '' });
                        }}
                        onReject={() => {
                          handleRejectRequest(request.id, { responseMessage: '' });
                        }}
                        onCounter={() => {
                          handleCounterRequest(request.id);
                        }}
                        onViewTimeline={() => {
                          handleViewTimeline(request.threadId ?? request.id);
                        }}
                        isLoading={loadingRequestIds.has(request.id)}
                      />
                    </Grid>
                  ))}
                </AnimatePresence>
              </Grid>
            )}
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            {currentRequests.length === 0 ? (
              <EmptyState
                icon={<SendIcon sx={{ fontSize: 64 }} />}
                title="Keine ausgehenden Anfragen"
                description="Du hast noch keine Match-Anfragen gesendet."
                actionLabel="Skills durchsuchen"
                actionHandler={() => {
                  void navigate('/skills');
                }}
              />
            ) : (
              <Grid container spacing={3}>
                <AnimatePresence>
                  {currentRequests.map((request) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={request.id}>
                      <MatchRequestCard
                        request={request}
                        onViewTimeline={() => {
                          handleViewTimeline(request.threadId ?? request.id);
                        }}
                      />
                    </Grid>
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
        onClose={() => {
          setFilterMenuAnchor(null);
        }}
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
        onClose={() => {
          setSortMenuAnchor(null);
        }}
      >
        <MenuItem
          onClick={() => {
            setSortBy('newest');
          }}
        >
          <ListItemText>Neueste zuerst</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setSortBy('oldest');
          }}
        >
          <ListItemText>Älteste zuerst</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setSortBy('rating');
          }}
        >
          <ListItemText>Nach Bewertung</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setSortBy('sessions');
          }}
        >
          <ListItemText>Nach Anzahl Sessions</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );

  return embedded ? content : <PageContainer>{content}</PageContainer>;
};

export default MatchRequestsOverviewPage;
