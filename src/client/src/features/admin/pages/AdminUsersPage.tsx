import React, { useEffect } from 'react';
import { formatDate } from 'date-fns';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  MenuItem,
  Stack,
  Grid,
  Avatar,
} from '@mui/material';
import EmptyState from '../../../shared/components/ui/EmptyState';
import PageLoader from '../../../shared/components/ui/PageLoader';
import useAdmin from '../hooks/useAdmin';

const AdminUsersPage: React.FC = () => {
  const { users, isLoadingUsers, fetchAdminUsers } = useAdmin();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<string>('all');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');

  useEffect(() => {
    fetchAdminUsers({ page: 1, limit: 100 });
  }, [fetchAdminUsers]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchQuery === '' ||
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'all' || user.roles.includes(roleFilter);
    const matchesStatus = statusFilter === 'all' || user.accountStatus === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => u.accountStatus === 'active').length,
    suspended: users.filter((u) => u.accountStatus === 'suspended').length,
    admins: users.filter((u) => u.roles.includes('Admin')).length,
  };

  const getStatusColor = (
    status: string
  ): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Suspended':
        return 'error';
      case 'Pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getRoleColor = (
    role: string
  ): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (role) {
      case 'Admin':
        return 'error';
      case 'Moderator':
        return 'warning';
      case 'User':
        return 'default';
      default:
        return 'default';
    }
  };

  if (isLoadingUsers) {
    return <PageLoader variant="list" message="Lade Benutzer..." />;
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Benutzerverwaltung
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Gesamt
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Aktiv
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.active}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Gesperrt
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats.suspended}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Admins
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.admins}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              placeholder="Suche nach Name oder E-Mail..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
              sx={{ flexGrow: 1 }}
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
            <TextField
              select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
              }}
              sx={{ minWidth: 150 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <FilterIcon />
                    </InputAdornment>
                  ),
                },
              }}
            >
              <MenuItem value="all">Alle Rollen</MenuItem>
              <MenuItem value="Admin">Admin</MenuItem>
              <MenuItem value="Moderator">Moderator</MenuItem>
              <MenuItem value="User">User</MenuItem>
            </TextField>
            <TextField
              select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
              }}
              sx={{ minWidth: 150 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <FilterIcon />
                    </InputAdornment>
                  ),
                },
              }}
            >
              <MenuItem value="all">Alle Status</MenuItem>
              <MenuItem value="Active">Aktiv</MenuItem>
              <MenuItem value="Suspended">Gesperrt</MenuItem>
              <MenuItem value="Pending">Ausstehend</MenuItem>
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Benutzer</TableCell>
                <TableCell>E-Mail</TableCell>
                <TableCell>Rolle</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Registriert am</TableCell>
                <TableCell>Letzte Aktivität</TableCell>
                <TableCell align="center">Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyState
                      title="Keine Benutzer gefunden"
                      description="Es wurden keine Benutzer mit den aktuellen Filterkriterien gefunden."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ width: 40, height: 40 }}>
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {user.firstName} {user.lastName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            ID: {user.id.slice(0, 8)}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.roles[0] ?? 'User'}
                        color={getRoleColor(user.roles[0] ?? 'user')}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.accountStatus}
                        color={getStatusColor(user.accountStatus)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {user.createdAt ? formatDate(user.createdAt, 'dd.MM.yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {user.lastLoginAt ? formatDate(user.lastLoginAt, 'dd.MM.yyyy HH:mm') : 'Nie'}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <IconButton size="small" color="primary">
                          <EditIcon />
                        </IconButton>
                        {user.accountStatus === 'active' ? (
                          <IconButton size="small" color="error">
                            <BlockIcon />
                          </IconButton>
                        ) : (
                          <IconButton size="small" color="success">
                            <CheckCircleIcon />
                          </IconButton>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default AdminUsersPage;
