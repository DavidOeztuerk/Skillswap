import React, { useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  People as PeopleIcon,
  Psychology as SkillIcon,
  Event as EventIcon,
  Handshake as HandshakeIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Alert,
  LinearProgress,
  IconButton,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  type SxProps,
  type Theme,
} from '@mui/material';
import PageContainer from '../../../shared/components/layout/PageContainer';
import PageHeader from '../../../shared/components/layout/PageHeader';
import AlertMessage from '../../../shared/components/ui/AlertMessage';
import LoadingSpinner from '../../../shared/components/ui/LoadingSpinner';
import useAdmin from '../hooks/useAdmin';

// ============================================================================
// PERFORMANCE: Extract sx objects as constants to prevent recreation
// ============================================================================

const statCardBoxSx: SxProps<Theme> = {
  flex: '1 1 calc(25% - 18px)',
  minWidth: '250px',
};

const wideCardBoxSx: SxProps<Theme> = {
  flex: '1 1 calc(50% - 12px)',
  minWidth: '400px',
};

const statAvatarBaseSx: SxProps<Theme> = {
  width: 56,
  height: 56,
};

const marginLeftSmallSx: SxProps<Theme> = {
  ml: 0.5,
};

const marginBottom2Sx: SxProps<Theme> = {
  mb: 2,
};

const marginBottom1Sx: SxProps<Theme> = {
  mb: 1,
};

const marginTop2Sx: SxProps<Theme> = {
  mt: 2,
};

const linkTextSx: SxProps<Theme> = {
  textDecoration: 'none',
};

const marginRight1Sx: SxProps<Theme> = {
  mr: 1,
};

const rankAvatarSx: SxProps<Theme> = {
  bgcolor: 'primary.main',
};

/** Get progress bar color based on usage threshold */
function getUsageColor(usage: number): 'error' | 'warning' | 'primary' {
  if (usage > 0.8) return 'error';
  if (usage > 0.6) return 'warning';
  return 'primary';
}

type ChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';

/** Get chip color for health status */
function getHealthStatusColor(status: string): ChipColor {
  switch (status) {
    case 'healthy':
      return 'success';
    case 'warning':
      return 'warning';
    case 'critical':
      return 'error';
    default:
      return 'default';
  }
}

/** Get chip color for service status */
function getServiceStatusColor(status: string): ChipColor {
  switch (status) {
    case 'online':
      return 'success';
    case 'degraded':
      return 'warning';
    case 'offline':
      return 'error';
    default:
      return 'default';
  }
}

const AdminDashboardPage: React.FC = () => {
  const {
    dashboard,
    systemHealth,
    isLoading,
    isLoadingSystemHealth,
    errorMessage,
    systemHealthError,
    fetchAdminDashboard,
    fetchSystemHealth,
  } = useAdmin();

  // Load dashboard data on mount
  useEffect(() => {
    fetchAdminDashboard();
    fetchSystemHealth();

    // Auto-refresh system health every 30 seconds
    const interval = setInterval(() => {
      fetchSystemHealth();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchAdminDashboard, fetchSystemHealth]);

  const handleRefresh = (): void => {
    fetchAdminDashboard();
    fetchSystemHealth();
  };

  if (isLoading && !dashboard) {
    return <LoadingSpinner fullPage message="Lade Admin Dashboard..." />;
  }

  if (errorMessage && !dashboard) {
    return (
      <PageContainer>
        <AlertMessage severity="error" message={[errorMessage]} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Systemübersicht und wichtige Kennzahlen"
        icon={<DashboardIcon />}
        actions={
          <IconButton onClick={handleRefresh} disabled={isLoading}>
            <RefreshIcon />
          </IconButton>
        }
      />

      {dashboard ? (
        <Box display="flex" flexWrap="wrap" gap={3}>
          {/* Overview Cards */}
          <Box sx={statCardBoxSx}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Benutzer (Gesamt)
                    </Typography>
                    <Typography variant="h4" component="h2">
                      {dashboard.overview.totalUsers.toLocaleString()}
                    </Typography>
                    <Typography color="textSecondary" variant="body2">
                      {dashboard.overview.activeUsers.toLocaleString()} aktiv
                    </Typography>
                  </Box>
                  <Avatar sx={{ ...statAvatarBaseSx, bgcolor: 'primary.main' }}>
                    <PeopleIcon />
                  </Avatar>
                </Box>
                <Box mt={2}>
                  <Box display="flex" alignItems="center">
                    <TrendingUpIcon color="success" fontSize="small" />
                    <Typography variant="body2" color="success.main" sx={marginLeftSmallSx}>
                      +{dashboard.recentActivity.newUsers} neue heute
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box sx={statCardBoxSx}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Skills (Gesamt)
                    </Typography>
                    <Typography variant="h4" component="h2">
                      {dashboard.overview.totalSkills.toLocaleString()}
                    </Typography>
                  </Box>
                  <Avatar sx={{ ...statAvatarBaseSx, bgcolor: 'secondary.main' }}>
                    <SkillIcon />
                  </Avatar>
                </Box>
                <Box mt={2}>
                  <Box display="flex" alignItems="center">
                    <TrendingUpIcon color="success" fontSize="small" />
                    <Typography variant="body2" color="success.main" sx={marginLeftSmallSx}>
                      +{dashboard.recentActivity.newSkills} neue heute
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box sx={statCardBoxSx}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Termine (Gesamt)
                    </Typography>
                    <Typography variant="h4" component="h2">
                      {dashboard.overview.totalAppointments.toLocaleString()}
                    </Typography>
                  </Box>
                  <Avatar sx={{ ...statAvatarBaseSx, bgcolor: 'info.main' }}>
                    <EventIcon />
                  </Avatar>
                </Box>
                <Box mt={2}>
                  <Box display="flex" alignItems="center">
                    <TrendingUpIcon color="success" fontSize="small" />
                    <Typography variant="body2" color="success.main" sx={marginLeftSmallSx}>
                      {dashboard.recentActivity.completedAppointments} heute abgeschlossen
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box sx={statCardBoxSx}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Matches (Gesamt)
                    </Typography>
                    <Typography variant="h4" component="h2">
                      {dashboard.overview.totalMatches.toLocaleString()}
                    </Typography>
                  </Box>
                  <Avatar sx={{ ...statAvatarBaseSx, bgcolor: 'success.main' }}>
                    <HandshakeIcon />
                  </Avatar>
                </Box>
                <Box mt={2}>
                  <Box display="flex" alignItems="center">
                    <HandshakeIcon color="success" fontSize="small" />
                    <Typography variant="body2" color="success.main" sx={marginLeftSmallSx}>
                      {dashboard.recentActivity.activeMatches} aktiv
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* System Health */}
          <Box sx={wideCardBoxSx}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6" component="h3">
                    System Status
                  </Typography>
                  {systemHealth?.status !== undefined && (
                    <Chip
                      label={systemHealth.status.toUpperCase()}
                      color={getHealthStatusColor(systemHealth.status)}
                      size="small"
                    />
                  )}
                </Box>

                {isLoadingSystemHealth ? <LinearProgress sx={marginBottom2Sx} /> : null}

                {systemHealthError ? (
                  <Alert severity="error" sx={marginBottom2Sx}>
                    {systemHealthError}
                  </Alert>
                ) : null}

                {systemHealth ? (
                  <Box>
                    {/* Performance Metrics */}
                    <Typography variant="subtitle2" gutterBottom>
                      Performance
                    </Typography>
                    <Box mb={2}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">CPU Auslastung</Typography>
                        <Typography variant="body2">
                          {((systemHealth.performance?.cpuUsage ?? 0) * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(systemHealth.performance?.cpuUsage ?? 0) * 100}
                        color={getUsageColor(systemHealth.performance?.cpuUsage ?? 0)}
                      />
                    </Box>

                    <Box mb={2}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">Speicher Auslastung</Typography>
                        <Typography variant="body2">
                          {((systemHealth.performance?.memoryUsage ?? 0) * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(systemHealth.performance?.memoryUsage ?? 0) * 100}
                        color={getUsageColor(systemHealth.performance?.memoryUsage ?? 0)}
                      />
                    </Box>

                    <Box mb={2}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">Festplatten Auslastung</Typography>
                        <Typography variant="body2">
                          {((systemHealth.performance?.diskUsage ?? 0) * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(systemHealth.performance?.diskUsage ?? 0) * 100}
                        color={getUsageColor(systemHealth.performance?.diskUsage ?? 0)}
                      />
                    </Box>

                    {/* Services Status */}
                    <Typography variant="subtitle2" gutterBottom sx={marginTop2Sx}>
                      Services
                    </Typography>
                    <List dense>
                      {(systemHealth.services ?? []).map((service, index) => (
                        <ListItem
                          key={service.name}
                          divider={index < (systemHealth.services?.length ?? 0) - 1}
                        >
                          <ListItemText
                            primary={service.name}
                            secondary={`Uptime: ${(service.uptime * 100).toFixed(1)}% | Response: ${String(service.responseTime)}ms`}
                          />
                          <Chip
                            label={service.status}
                            color={getServiceStatusColor(service.status)}
                            size="small"
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                ) : null}
              </CardContent>
            </Card>
          </Box>

          {/* Top Categories */}
          <Box sx={wideCardBoxSx}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h3" gutterBottom>
                  Top Skill Kategorien
                </Typography>
                <List>
                  {dashboard.topCategories.map((category, index) => (
                    <ListItem
                      key={category.name}
                      divider={index < dashboard.topCategories.length - 1}
                    >
                      <ListItemAvatar>
                        <Avatar sx={rankAvatarSx}>{index + 1}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={category.name}
                        secondary={`${category.count.toLocaleString()} Skills`}
                      />
                      <Box display="flex" alignItems="center">
                        {category.growth > 0 ? (
                          <TrendingUpIcon color="success" fontSize="small" />
                        ) : (
                          <TrendingDownIcon color="error" fontSize="small" />
                        )}
                        <Typography
                          variant="body2"
                          color={category.growth > 0 ? 'success.main' : 'error.main'}
                          sx={marginLeftSmallSx}
                        >
                          {category.growth > 0 ? '+' : ''}
                          {(category.growth * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Box>

          {/* Pending Reports Alert */}
          {dashboard.overview.pendingReports > 0 && (
            <Box>
              <Alert
                severity="warning"
                action={
                  <Typography
                    variant="body2"
                    component="a"
                    href="/admin/moderation"
                    sx={linkTextSx}
                  >
                    Berichte anzeigen
                  </Typography>
                }
              >
                <Box display="flex" alignItems="center">
                  <WarningIcon sx={marginRight1Sx} />
                  Es gibt {dashboard.overview.pendingReports} ausstehende Moderationsberichte, die
                  Ihre Aufmerksamkeit erfordern.
                </Box>
              </Alert>
            </Box>
          )}

          {/* System Alerts */}
          {systemHealth?.alerts !== undefined &&
            systemHealth.alerts.some((alert) => !alert.resolved) && (
              <Box>
                <Card>
                  <CardContent>
                    <Typography variant="h6" component="h3" gutterBottom>
                      System Warnungen
                    </Typography>
                    {systemHealth.alerts
                      .filter((alert) => !alert.resolved)
                      .map((alert) => (
                        <Alert
                          key={alert.id}
                          severity={alert.severity as 'error' | 'warning' | 'info' | 'success'}
                          sx={marginBottom1Sx}
                        >
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {alert.service ? `${alert.service}: ` : null}
                              {alert.message}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {formatDistanceToNow(new Date(alert.timestamp), {
                                addSuffix: true,
                                locale: de,
                              })}
                            </Typography>
                          </Box>
                        </Alert>
                      ))}
                  </CardContent>
                </Card>
              </Box>
            )}
        </Box>
      ) : null}
    </PageContainer>
  );
};

export default AdminDashboardPage;
