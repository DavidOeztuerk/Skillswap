import React, { useEffect } from 'react';
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
} from '@mui/material';
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
import { useAppDispatch, useAppSelector } from '../../store/store.hooks';
import { fetchAdminDashboard, fetchSystemHealth } from '../../features/admin/adminSlice';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/layout/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import AlertMessage from '../../components/ui/AlertMessage';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

const AdminDashboardPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    dashboard,
    systemHealth,
    isLoading,
    isLoadingSystemHealth,
    error,
    systemHealthError,
  } = useAppSelector((state) => state.admin);

  useEffect(() => {
    dispatch(fetchAdminDashboard());
    dispatch(fetchSystemHealth());
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      dispatch(fetchSystemHealth());
    }, 30000);
    
    return () => clearInterval(interval);
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchAdminDashboard());
    dispatch(fetchSystemHealth());
  };

  if (isLoading && !dashboard) {
    return <LoadingSpinner fullPage message="Lade Admin Dashboard..." />;
  }

  if (error && !dashboard) {
    return (
      <PageContainer>
        <AlertMessage
          severity="error"
          message={[error.message]}
        />
      </PageContainer>
    );
  }

  const getHealthStatusColor = (status: string) => {
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
  };

  const getServiceStatusColor = (status: string) => {
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
  };

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

      {dashboard && (
        <Box display="flex" flexWrap="wrap" gap={3}>
          {/* Overview Cards */}
          <Box sx={{ flex: '1 1 calc(25% - 18px)', minWidth: '250px' }}>
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
                  <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                    <PeopleIcon />
                  </Avatar>
                </Box>
                <Box mt={2}>
                  <Box display="flex" alignItems="center">
                    <TrendingUpIcon color="success" fontSize="small" />
                    <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                      +{dashboard.recentActivity.newUsers} neue heute
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: '1 1 calc(25% - 18px)', minWidth: '250px' }}>
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
                  <Avatar sx={{ bgcolor: 'secondary.main', width: 56, height: 56 }}>
                    <SkillIcon />
                  </Avatar>
                </Box>
                <Box mt={2}>
                  <Box display="flex" alignItems="center">
                    <TrendingUpIcon color="success" fontSize="small" />
                    <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                      +{dashboard.recentActivity.newSkills} neue heute
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: '1 1 calc(25% - 18px)', minWidth: '250px' }}>
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
                  <Avatar sx={{ bgcolor: 'info.main', width: 56, height: 56 }}>
                    <EventIcon />
                  </Avatar>
                </Box>
                <Box mt={2}>
                  <Box display="flex" alignItems="center">
                    <TrendingUpIcon color="success" fontSize="small" />
                    <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                      {dashboard.recentActivity.completedAppointments} heute abgeschlossen
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: '1 1 calc(25% - 18px)', minWidth: '250px' }}>
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
                  <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
                    <HandshakeIcon />
                  </Avatar>
                </Box>
                <Box mt={2}>
                  <Box display="flex" alignItems="center">
                    <HandshakeIcon color="success" fontSize="small" />
                    <Typography variant="body2" color="success.main" sx={{ ml: 0.5 }}>
                      {dashboard.recentActivity.activeMatches} aktiv
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* System Health */}
          <Box sx={{ flex: '1 1 calc(50% - 12px)', minWidth: '400px' }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6" component="h3">
                    System Status
                  </Typography>
                  {systemHealth && (
                    <Chip
                      label={systemHealth.status.toUpperCase()}
                      color={getHealthStatusColor(systemHealth.status) as any}
                      size="small"
                    />
                  )}
                </Box>

                {isLoadingSystemHealth && <LinearProgress sx={{ mb: 2 }} />}
                
                {systemHealthError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {systemHealthError.message}
                  </Alert>
                )}

                {systemHealth && (
                  <Box>
                    {/* Performance Metrics */}
                    <Typography variant="subtitle2" gutterBottom>
                      Performance
                    </Typography>
                    <Box mb={2}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">CPU Auslastung</Typography>
                        <Typography variant="body2">
                          {(systemHealth.performance.cpuUsage * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={systemHealth.performance.cpuUsage}
                        color={systemHealth.performance.cpuUsage > 80 ? 'error' : systemHealth.performance.cpuUsage > 60 ? 'warning' : 'primary'}
                      />
                    </Box>

                    <Box mb={2}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">Speicher Auslastung</Typography>
                        <Typography variant="body2">
                          {(systemHealth.performance.memoryUsage * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={systemHealth.performance.memoryUsage}
                        color={systemHealth.performance.memoryUsage > 80 ? 'error' : systemHealth.performance.memoryUsage > 60 ? 'warning' : 'primary'}
                      />
                    </Box>

                    <Box mb={2}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">Festplatten Auslastung</Typography>
                        <Typography variant="body2">
                          {(systemHealth.performance.diskUsage * 100).toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={systemHealth.performance.diskUsage}
                        color={systemHealth.performance.diskUsage > 80 ? 'error' : systemHealth.performance.diskUsage > 60 ? 'warning' : 'primary'}
                      />
                    </Box>

                    {/* Services Status */}
                    <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                      Services
                    </Typography>
                    <List dense>
                      {systemHealth.services.map((service, index) => (
                        <ListItem key={service.name} divider={index < systemHealth.services?.length - 1}>
                          <ListItemText
                            primary={service.name}
                            secondary={`Uptime: ${(service.uptime * 100).toFixed(1)}% | Response: ${service.responseTime}ms`}
                          />
                          <Chip
                            label={service.status}
                            color={getServiceStatusColor(service.status) as any}
                            size="small"
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>

          {/* Top Categories */}
          <Box sx={{ flex: '1 1 calc(50% - 12px)', minWidth: '400px' }}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h3" gutterBottom>
                  Top Skill Kategorien
                </Typography>
                <List>
                  {dashboard.topCategories.map((category, index) => (
                    <ListItem key={category.name} divider={index < dashboard.topCategories?.length - 1}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {index + 1}
                        </Avatar>
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
                          sx={{ ml: 0.5 }}
                        >
                          {category.growth > 0 ? '+' : ''}{(category.growth * 100).toFixed(1)}%
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
                  <Typography variant="body2" component="a" href="/admin/moderation" sx={{ textDecoration: 'none' }}>
                    Berichte anzeigen
                  </Typography>
                }
              >
                <Box display="flex" alignItems="center">
                  <WarningIcon sx={{ mr: 1 }} />
                  Es gibt {dashboard.overview.pendingReports} ausstehende Moderationsberichte, die Ihre Aufmerksamkeit erfordern.
                </Box>
              </Alert>
            </Box>
          )}

          {/* System Alerts */}
          {systemHealth?.alerts && systemHealth.alerts.filter(alert => !alert.resolved)?.length > 0 && (
            <Box>
              <Card>
                <CardContent>
                  <Typography variant="h6" component="h3" gutterBottom>
                    System Warnungen
                  </Typography>
                  {systemHealth.alerts
                    .filter(alert => !alert.resolved)
                    .map((alert) => (
                      <Alert
                        key={alert.id}
                        severity={alert.severity as any}
                        sx={{ mb: 1 }}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {alert.service && `${alert.service}: `}{alert.message}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {formatDistanceToNow(new Date(alert.timestamp), { 
                              addSuffix: true,
                              locale: de 
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
      )}
    </PageContainer>
  );
};

export default AdminDashboardPage;