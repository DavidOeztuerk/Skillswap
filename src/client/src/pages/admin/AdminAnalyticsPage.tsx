import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  TextField,
  MenuItem,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  ShowChart as ChartIcon,
} from '@mui/icons-material';
import { useAdmin } from '../../hooks/useAdmin';
import PageLoader from '../../components/ui/PageLoader';

const AdminAnalyticsPage: React.FC = () => {
  const { analytics, isLoadingAnalytics, fetchAdminAnalytics } = useAdmin();
  const [timeRange, setTimeRange] = React.useState<string>('7d');

  useEffect(() => {
    fetchAdminAnalytics(timeRange as '7d' | '30d' | '90d' | '1y');
  }, [fetchAdminAnalytics, timeRange]);

  if (isLoadingAnalytics && analytics === undefined) {
    return <PageLoader variant="dashboard" message="Lade Analytics..." />;
  }

  const metrics = {
    totalUsers: analytics?.totalUsers ?? 0,
    activeUsers: analytics?.activeUsers ?? 0,
    totalSkills: analytics?.totalSkills ?? 0,
    totalMatches: analytics?.totalMatches ?? 0,
    totalAppointments: analytics?.totalAppointments ?? 0,
    completedAppointments: analytics?.completedAppointments ?? 0,
    userGrowthRate: analytics?.userGrowthRate ?? 0,
    matchSuccessRate: analytics?.matchSuccessRate ?? 0,
  };

  const topSkills: { name: string; count: number }[] = analytics?.topSkills ?? [
    { name: 'JavaScript', count: 45 },
    { name: 'React', count: 38 },
    { name: 'Python', count: 32 },
    { name: 'TypeScript', count: 28 },
    { name: 'Node.js', count: 25 },
  ];

  const recentActivity: {
    date: string;
    newUsers: number;
    newMatches: number;
    newAppointments: number;
  }[] = analytics?.recentActivity ?? [
    { date: '2025-01-08', newUsers: 12, newMatches: 8, newAppointments: 15 },
    { date: '2025-01-07', newUsers: 15, newMatches: 10, newAppointments: 18 },
    { date: '2025-01-06', newUsers: 8, newMatches: 6, newAppointments: 12 },
    { date: '2025-01-05', newUsers: 10, newMatches: 7, newAppointments: 14 },
    { date: '2025-01-04', newUsers: 13, newMatches: 9, newAppointments: 16 },
  ];

  return (
    <Box p={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Analytics Dashboard</Typography>
        <TextField
          select
          value={timeRange}
          onChange={(e) => {
            setTimeRange(e.target.value);
          }}
          sx={{ minWidth: 150 }}
          size="small"
        >
          <MenuItem value="24h">Letzte 24h</MenuItem>
          <MenuItem value="7d">Letzte 7 Tage</MenuItem>
          <MenuItem value="30d">Letzte 30 Tage</MenuItem>
          <MenuItem value="90d">Letzte 90 Tage</MenuItem>
        </TextField>
      </Stack>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <PeopleIcon color="primary" />
                <Typography variant="h6">Nutzer</Typography>
              </Stack>
              <Typography variant="h4" sx={{ mt: 2 }}>
                {metrics.totalUsers}
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mt={1}>
                <Chip label={`${String(metrics.activeUsers)} aktiv`} color="success" size="small" />
                <Typography variant="caption" color="success.main">
                  +{String(metrics.userGrowthRate)}% Wachstum
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <AssessmentIcon color="secondary" />
                <Typography variant="h6">Skills</Typography>
              </Stack>
              <Typography variant="h4" sx={{ mt: 2 }}>
                {metrics.totalSkills}
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                Aktive Skills im System
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <TrendingUpIcon color="success" />
                <Typography variant="h6">Matches</Typography>
              </Stack>
              <Typography variant="h4" sx={{ mt: 2 }}>
                {metrics.totalMatches}
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mt={1}>
                <LinearProgress
                  variant="determinate"
                  value={metrics.matchSuccessRate}
                  sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                  color="success"
                />
                <Typography variant="caption">{metrics.matchSuccessRate}%</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1}>
                <ChartIcon color="info" />
                <Typography variant="h6">Termine</Typography>
              </Stack>
              <Typography variant="h4" sx={{ mt: 2 }}>
                {metrics.totalAppointments}
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                {metrics.completedAppointments} abgeschlossen
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Top Skills */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Skills
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Skill</TableCell>
                      <TableCell align="right">Anzahl</TableCell>
                      <TableCell align="right">Anteil</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topSkills.map((skill, index) => {
                      const percentage =
                        metrics.totalSkills > 0
                          ? ((skill.count / metrics.totalSkills) * 100).toFixed(1)
                          : 0;
                      return (
                        <TableRow key={index}>
                          <TableCell>{skill.name}</TableCell>
                          <TableCell align="right">{skill.count}</TableCell>
                          <TableCell align="right">
                            <Box
                              display="flex"
                              alignItems="center"
                              justifyContent="flex-end"
                              gap={1}
                            >
                              <LinearProgress
                                variant="determinate"
                                value={Number(percentage)}
                                sx={{ width: 60, height: 6, borderRadius: 3 }}
                              />
                              <Typography variant="caption">{percentage}%</Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Aktivitätsverlauf
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Datum</TableCell>
                      <TableCell align="right">Neue Nutzer</TableCell>
                      <TableCell align="right">Neue Matches</TableCell>
                      <TableCell align="right">Neue Termine</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentActivity.map((activity, index) => (
                      <TableRow key={index}>
                        <TableCell>{activity.date}</TableCell>
                        <TableCell align="right">
                          <Chip label={activity.newUsers} color="primary" size="small" />
                        </TableCell>
                        <TableCell align="right">
                          <Chip label={activity.newMatches} color="success" size="small" />
                        </TableCell>
                        <TableCell align="right">
                          <Chip label={activity.newAppointments} color="info" size="small" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* User Engagement */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Engagement Metrics
              </Typography>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography color="textSecondary" variant="body2">
                    Durchschnittliche Session-Dauer
                  </Typography>
                  <Typography variant="h5">{analytics?.avgSessionDuration ?? '12m 34s'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography color="textSecondary" variant="body2">
                    Sessions pro Nutzer
                  </Typography>
                  <Typography variant="h5">{analytics?.sessionsPerUser ?? '3.2'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography color="textSecondary" variant="body2">
                    Match-zu-Termin Conversion
                  </Typography>
                  <Typography variant="h5" color="success.main">
                    {analytics?.matchToAppointmentRate ?? '68%'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Typography color="textSecondary" variant="body2">
                    Durchschnittliche Bewertung
                  </Typography>
                  <Typography variant="h5" color="warning.main">
                    {analytics?.avgRating ?? '4.6'} ⭐
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

export default AdminAnalyticsPage;
