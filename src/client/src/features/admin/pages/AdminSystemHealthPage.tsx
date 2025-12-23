import React, { useEffect } from 'react';
import {
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Storage as DatabaseIcon,
  Cloud as ServiceIcon,
  Speed as PerformanceIcon,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import PageLoader from '../../../shared/components/ui/PageLoader';
import useAdmin from '../hooks/useAdmin';

const AdminSystemHealthPage: React.FC = () => {
  const { systemHealth, isLoading, fetchSystemHealth } = useAdmin();

  useEffect(() => {
    fetchSystemHealth();
    const interval = setInterval(fetchSystemHealth, 30000); // Refresh every 30s
    return () => {
      clearInterval(interval);
    };
  }, [fetchSystemHealth]);

  if (isLoading && !systemHealth) {
    return <PageLoader variant="dashboard" message="Lade Systemstatus..." />;
  }

  const getHealthColor = (
    status: string
  ): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return 'success';
      case 'degraded':
        return 'warning';
      case 'unhealthy':
        return 'error';
      default:
        return 'default';
    }
  };

  const getHealthIcon = (status: string): React.ReactNode => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return <CheckIcon color="success" />;
      case 'degraded':
        return <WarningIcon color="warning" />;
      case 'unhealthy':
        return <ErrorIcon color="error" />;
      default:
        return <ErrorIcon />;
    }
  };

  const services = [
    { name: 'UserService', status: systemHealth?.userService ?? 'Unknown', port: 5001 },
    { name: 'SkillService', status: systemHealth?.skillService ?? 'Unknown', port: 5002 },
    {
      name: 'MatchmakingService',
      status: systemHealth?.matchmakingService ?? 'Unknown',
      port: 5003,
    },
    {
      name: 'AppointmentService',
      status: systemHealth?.appointmentService ?? 'Unknown',
      port: 5004,
    },
    { name: 'VideocallService', status: systemHealth?.videocallService ?? 'Unknown', port: 5005 },
    {
      name: 'NotificationService',
      status: systemHealth?.notificationService ?? 'Unknown',
      port: 5006,
    },
    { name: 'Gateway', status: systemHealth?.gateway ?? 'Unknown', port: 8080 },
  ];

  const infrastructure = [
    { name: 'PostgreSQL', status: systemHealth?.database ?? 'Unknown', type: 'Database' },
    { name: 'Redis', status: systemHealth?.cache ?? 'Unknown', type: 'Cache' },
    { name: 'RabbitMQ', status: systemHealth?.messageBus ?? 'Unknown', type: 'Message Bus' },
  ];

  const overallHealth = systemHealth?.status ?? 'Unknown';
  const healthyServices = services.filter((s) => s.status.toLowerCase() === 'healthy').length;
  const totalServices = services.length;

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        System Health
      </Typography>

      {/* Overall Health */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <Box display="flex" alignItems="center" gap={2}>
                {getHealthIcon(overallHealth)}
                <Box>
                  <Typography variant="h6">Gesamtstatus</Typography>
                  <Chip label={overallHealth} color={getHealthColor(overallHealth)} size="small" />
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography variant="body2" gutterBottom>
                Services: {healthyServices} / {totalServices} Healthy
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(healthyServices / totalServices) * 100}
                color={healthyServices === totalServices ? 'success' : 'warning'}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Microservices */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <ServiceIcon />
                <Typography variant="h6">Microservices</Typography>
              </Box>
              <List>
                {services.map((service) => (
                  <ListItem key={service.name}>
                    <ListItemIcon>{getHealthIcon(service.status)}</ListItemIcon>
                    <ListItemText
                      primary={service.name}
                      secondary={`Port: ${service.port.toString()}`}
                    />
                    <Chip
                      label={service.status}
                      color={getHealthColor(service.status)}
                      size="small"
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Infrastructure */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <DatabaseIcon />
                <Typography variant="h6">Infrastructure</Typography>
              </Box>
              <List>
                {infrastructure.map((infra) => (
                  <ListItem key={infra.name}>
                    <ListItemIcon>{getHealthIcon(infra.status)}</ListItemIcon>
                    <ListItemText primary={infra.name} secondary={infra.type} />
                    <Chip label={infra.status} color={getHealthColor(infra.status)} size="small" />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Metrics */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <PerformanceIcon />
                <Typography variant="h6">Performance Metrics</Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography color="textSecondary" variant="body2">
                    Durchschnittliche Response Time
                  </Typography>
                  <Typography variant="h5">{systemHealth?.avgResponseTime ?? 'N/A'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography color="textSecondary" variant="body2">
                    Requests/Minute
                  </Typography>
                  <Typography variant="h5">{systemHealth?.requestsPerMinute ?? 'N/A'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography color="textSecondary" variant="body2">
                    Error Rate
                  </Typography>
                  <Typography variant="h5" color="error">
                    {systemHealth?.errorRate ?? 'N/A'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography color="textSecondary" variant="body2">
                    Uptime
                  </Typography>
                  <Typography variant="h5" color="success.main">
                    {systemHealth?.uptime ?? 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminSystemHealthPage;
