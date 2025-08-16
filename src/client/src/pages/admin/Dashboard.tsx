import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Category as CategoryIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon,
  RefreshOutlined
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Grid } from '../../components/common/GridCompat';
import { unwrap, withDefault } from '../../utils/safeAccess';
import { AdminErrorBoundary } from '../../components/error';
import errorService from '../../services/errorService';
import { AdminDashboardData } from '../../types/models/Admin';
import apiClient from '../../api/apiClient';
import { usePermissions } from '../../contexts/PermissionContext'

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalSkills: number;
  totalAppointments: number;
  totalMatches: number;
  newUsersToday: number;
  pendingReports: number;
  systemHealth: string;
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactElement;
  color: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, onClick }) => (
  <Card
    sx={{
      height: '100%',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform 0.2s',
      '&:hover': onClick ? {
        transform: 'translateY(-4px)',
        boxShadow: 3
      } : {}
    }}
    onClick={onClick}
  >
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h4" component="div">
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: `${color}20`,
            borderRadius: 2,
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '& svg': {
              color: color,
              fontSize: 32
            }
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardStats = async () => {
    try {
      setRefreshing(true);
      errorService.addBreadcrumb('Fetching admin dashboard stats', 'admin');
      
      const response = await apiClient.get<AdminDashboardData>('/api/admin/analytics/dashboard');
      const statsData = unwrap<any>(response);
      
      setStats({
        totalUsers: withDefault(statsData?.totalUsers, 0),
        activeUsers: withDefault(statsData?.activeUsers, 0),
        totalSkills: withDefault(statsData?.totalSkills, 0),
        totalAppointments: withDefault(statsData?.totalAppointments, 0),
        totalMatches: withDefault(statsData?.totalMatches, 0),
        newUsersToday: withDefault(statsData?.newUsersToday, 0),
        pendingReports: withDefault(statsData?.pendingReports, 0),
        systemHealth: withDefault(statsData?.systemHealth, 'Unknown')
      });
      setError(null);
      errorService.addBreadcrumb('Dashboard stats loaded successfully', 'admin');
    } catch (err: any) {
      // Set default empty stats on error
      if (err?.response?.status === 404) {
        const emptyStats: DashboardStats = {
          totalUsers: 0,
          activeUsers: 0,
          totalSkills: 0,
          totalAppointments: 0,
          totalMatches: 0,
          newUsersToday: 0,
          pendingReports: 0,
          systemHealth: 'Unknown'
        };
        setStats(emptyStats);
        setError('Dashboard API endpoint nicht verfügbar. Die Statistiken werden nachgereicht.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!hasPermission('admin:access_dashboard')) {
      navigate('/');
      return;
    }
    fetchDashboardStats();
  }, [hasPermission, navigate]);

  const handleRefresh = () => {
    fetchDashboardStats();
  };

  if (loading && !stats) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1">
            Admin Dashboard
          </Typography>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              <RefreshOutlined className={refreshing ? 'rotating' : ''} />
            </IconButton>
          </Tooltip>
        </Box>
        <Typography variant="body1" color="textSecondary">
          Welcome back, {user?.firstName}! Here's an overview of the platform.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* User Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            icon={<PeopleIcon />}
            color="#2196f3"
            onClick={() => hasPermission('users:view_all') && navigate('/admin/users')}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Users"
            value={stats?.activeUsers || 0}
            icon={<TrendingUpIcon />}
            color="#4caf50"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Skills"
            value={stats?.totalSkills || 0}
            icon={<CategoryIcon />}
            color="#ff9800"
            onClick={() => hasPermission('skills:view_all') && navigate('/admin/skills')}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Appointments"
            value={stats?.totalAppointments || 0}
            icon={<AssignmentIcon />}
            color="#9c27b0"
            onClick={() => hasPermission('appointments:view_all') && navigate('/admin/appointments')}
          />
        </Grid>

        {/* Additional Stats */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="New Users Today"
            value={stats?.newUsersToday || 0}
            icon={<PeopleIcon />}
            color="#00bcd4"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Matches"
            value={stats?.totalMatches || 0}
            icon={<AnalyticsIcon />}
            color="#673ab7"
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Reports"
            value={stats?.pendingReports || 0}
            icon={<SecurityIcon />}
            color="#f44336"
            onClick={() => hasPermission('reports:handle') && navigate('/admin/reports')}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="System Health"
            value={stats?.systemHealth || 'Unknown'}
            icon={<TrendingUpIcon />}
            color={stats?.systemHealth === 'Healthy' ? '#4caf50' : '#f44336'}
          />
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {hasPermission('users:create') && (
                <Grid item>
                  <Box
                    component="button"
                    onClick={() => navigate('/admin/users/create')}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      backgroundColor: 'background.paper',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                  >
                    <PeopleIcon sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="body2">Create User</Typography>
                  </Box>
                </Grid>
              )}

              {hasPermission('skills:manage_categories') && (
                <Grid item>
                  <Box
                    component="button"
                    onClick={() => navigate('/admin/skills/categories')}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      backgroundColor: 'background.paper',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                  >
                    <CategoryIcon sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="body2">Manage Categories</Typography>
                  </Box>
                </Grid>
              )}

              {hasPermission('roles:view') && (
                <Grid item>
                  <Box
                    component="button"
                    onClick={() => navigate('/admin/roles')}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      backgroundColor: 'background.paper',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                  >
                    <SecurityIcon sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="body2">Manage Roles</Typography>
                  </Box>
                </Grid>
              )}

              {hasPermission('system:view_logs') && (
                <Grid item>
                  <Box
                    component="button"
                    onClick={() => navigate('/admin/system/logs')}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      backgroundColor: 'background.paper',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: 'action.hover'
                      }
                    }}
                  >
                    <AnalyticsIcon sx={{ fontSize: 32, mb: 1 }} />
                    <Typography variant="body2">View Logs</Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      <style>{`
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .rotating {
          animation: rotate 1s linear infinite;
        }
      `}</style>
    </Container>
  );
};

// Export wrapped component
const AdminDashboardWithErrorBoundary: React.FC = () => (
  <AdminErrorBoundary>
    <AdminDashboard />
  </AdminErrorBoundary>
);

export default AdminDashboardWithErrorBoundary;