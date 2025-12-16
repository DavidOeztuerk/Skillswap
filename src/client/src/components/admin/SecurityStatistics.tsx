import React, { memo, useMemo } from 'react';
import { Card, CardContent, Typography, Box, Grid, LinearProgress, Chip } from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';
import type { SecurityAlertStatisticsResponse } from '../../types/models/SecurityAlert';

interface SecurityStatisticsProps {
  statistics?: SecurityAlertStatisticsResponse;
  isLoading?: boolean;
}

const SecurityStatistics: React.FC<SecurityStatisticsProps> = memo(({ statistics, isLoading }) => {
  const { criticalPercentage, highPercentage, mediumPercentage } = useMemo(() => {
    if (!statistics) return { criticalPercentage: 0, highPercentage: 0, mediumPercentage: 0 };
    const total = statistics.totalAlerts;
    return {
      criticalPercentage: total > 0 ? (statistics.criticalAlerts / total) * 100 : 0,
      highPercentage: total > 0 ? (statistics.highAlerts / total) * 100 : 0,
      mediumPercentage: total > 0 ? (statistics.mediumAlerts / total) * 100 : 0,
    };
  }, [statistics]);

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Statistiken
          </Typography>
          <LinearProgress />
        </CardContent>
      </Card>
    );
  }

  if (!statistics) {
    return null;
  }

  return (
    <Grid container spacing={2}>
      {/* Overview Card */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <ShieldIcon color="primary" />
              <Typography variant="h6">Übersicht</Typography>
            </Box>

            <Box mb={3}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Gesamt Alerts</Typography>
                <Typography variant="h5" fontWeight="bold">
                  {statistics.totalAlerts.toLocaleString()}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Ungelesen</Typography>
                <Chip
                  label={statistics.unreadAlerts.toLocaleString()}
                  color={statistics.unreadAlerts > 0 ? 'warning' : 'default'}
                  size="small"
                />
              </Box>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="body2">Dismissed</Typography>
                <Typography variant="body2" color="text.secondary">
                  {statistics.dismissedAlerts.toLocaleString()}
                </Typography>
              </Box>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Nach Schweregrad
              </Typography>

              <Box mb={2}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <ErrorIcon color="error" fontSize="small" />
                    <Typography variant="body2">Kritisch</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight="bold">
                    {statistics.criticalAlerts}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={criticalPercentage}
                  color="error"
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>

              <Box mb={2}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <ErrorIcon color="error" fontSize="small" />
                    <Typography variant="body2">Hoch</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight="bold">
                    {statistics.highAlerts}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={highPercentage}
                  color="error"
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>

              <Box mb={2}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <WarningIcon color="warning" fontSize="small" />
                    <Typography variant="body2">Mittel</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight="bold">
                    {statistics.mediumAlerts}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={mediumPercentage}
                  color="warning"
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>

              <Box mb={2}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <InfoIcon color="info" fontSize="small" />
                    <Typography variant="body2">Niedrig</Typography>
                  </Box>
                  <Typography variant="body2">{statistics.lowAlerts}</Typography>
                </Box>
              </Box>

              <Box>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <InfoIcon color="success" fontSize="small" />
                    <Typography variant="body2">Info</Typography>
                  </Box>
                  <Typography variant="body2">{statistics.infoAlerts}</Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Top Alert Types */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Top Alert-Typen
            </Typography>

            <Box>
              {statistics.alertsByType
                .sort((a, b) => b.count - a.count)
                .slice(0, 10)
                .map((item, index) => (
                  <Box
                    key={item.type}
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    mb={1}
                    pb={1}
                    borderBottom={index < 9 ? 1 : 0}
                    borderColor="divider"
                  >
                    <Typography variant="body2" noWrap sx={{ flex: 1, mr: 2 }}>
                      {item.typeName}
                    </Typography>
                    <Chip
                      label={item.count}
                      size="small"
                      color={item.count > 10 ? 'error' : item.count > 5 ? 'warning' : 'default'}
                    />
                  </Box>
                ))}
            </Box>

            {statistics.alertsByType.length === 0 && (
              <Typography variant="body2" color="text.secondary" align="center">
                Keine Daten verfügbar
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Top Affected Users */}
      {statistics.topAffectedUsers.length > 0 && (
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Am meisten betroffene User
              </Typography>

              <Box>
                {statistics.topAffectedUsers.slice(0, 10).map((user, index) => (
                  <Box
                    key={user.userId}
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    mb={1}
                    pb={1}
                    borderBottom={
                      index < Math.min(statistics.topAffectedUsers.length - 1, 9) ? 1 : 0
                    }
                    borderColor="divider"
                  >
                    <Box flex={1} mr={2}>
                      <Typography variant="body2" noWrap>
                        {user.userName || user.userId}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {user.userId}
                      </Typography>
                    </Box>
                    <Chip
                      label={user.alertCount}
                      size="small"
                      color={
                        user.alertCount > 10 ? 'error' : user.alertCount > 5 ? 'warning' : 'default'
                      }
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Top Affected IPs */}
      {statistics.topAffectedIPs.length > 0 && (
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Am meisten betroffene IPs
              </Typography>

              <Box>
                {statistics.topAffectedIPs.slice(0, 10).map((ip, index) => (
                  <Box
                    key={ip.ipAddress}
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    mb={1}
                    pb={1}
                    borderBottom={index < Math.min(statistics.topAffectedIPs.length - 1, 9) ? 1 : 0}
                    borderColor="divider"
                  >
                    <Typography variant="body2" fontFamily="monospace">
                      {ip.ipAddress}
                    </Typography>
                    <Chip
                      label={ip.alertCount}
                      size="small"
                      color={
                        ip.alertCount > 10 ? 'error' : ip.alertCount > 5 ? 'warning' : 'default'
                      }
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );
});

SecurityStatistics.displayName = 'SecurityStatistics';

export default SecurityStatistics;
