import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  Stack
} from '@mui/material';
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Block as BlockIcon,
  LockOpen as UnblockIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PersonAdd as PersonAddIcon,
  Security as SecurityIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { usePermission } from '../../contexts/PermissionContext';
import apiClient from '../../services/apiClient';
import { format } from 'date-fns';
import { withDefault, safeGet, ensureArray } from '../../utils/safeAccess';

interface User {
  id: string;
  email: string;
  userName: string;
  firstName: string;
  lastName: string;
  roles: string[];
  accountStatus: string;
  emailVerified: boolean;
  createdAt: string;
  lastLogin?: string;
}


const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const { hasPermission, isSuperAdmin, isAdmin } = usePermission();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  
  // Rollenhierarchie: SuperAdmin kann alle Rollen vergeben, Admin kann nur Admin und darunter
  const getAvailableRoles = () => {
    if (isSuperAdmin) {
      return ['User', 'Moderator', 'Admin', 'SuperAdmin'];
    } else if (isAdmin) {
      return ['User', 'Moderator', 'Admin']; // Admin kann keinen SuperAdmin erstellen
    }
    return ['User']; // Fallback
  };
  
  const [availableRoles] = useState(getAvailableRoles());

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<any>('/api/admin/users', {
        params: {
          page: page + 1,
          pageSize: rowsPerPage,
          search: searchTerm
        }
      });
      
      const responseData = safeGet(response, 'data.data', null) || safeGet(response, 'data', null) || response;
      setUsers(ensureArray(responseData?.items || responseData?.users || responseData));
      setTotalCount(withDefault(responseData?.totalCount, 0));
      setError(null);
    } catch (err: any) {
      // Handle 404 - endpoint not implemented yet
      if (err?.response?.status === 404) {
        setUsers([]);
        setTotalCount(0);
        setError('User Management API endpoint nicht verfügbar. Diese Funktion wird nachgereicht.');
      } else {
        setError(safeGet(err, 'response.data.message', 'Failed to load users'));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasPermission('users:view_all')) {
      navigate('/');
      return;
    }
    fetchUsers();
  }, [page, rowsPerPage, searchTerm]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
    // Prüfe ob der aktuelle Admin diesen User bearbeiten darf
    const canEditUser = isSuperAdmin || (isAdmin && !user.roles.includes('SuperAdmin'));
    
    if (!canEditUser) {
      setError('Sie haben keine Berechtigung, diesen Benutzer zu bearbeiten.');
      return;
    }
    
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleBlockUser = async () => {
    if (!selectedUser) return;
    try {
      await apiClient.post(`/api/admin/users/${selectedUser.id}/block`);
      await fetchUsers();
      handleMenuClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to block user');
    }
  };

  const handleUnblockUser = async () => {
    if (!selectedUser) return;
    try {
      await apiClient.post(`/api/admin/users/${selectedUser.id}/unblock`);
      await fetchUsers();
      handleMenuClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to unblock user');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await apiClient.delete(`/api/admin/users/${selectedUser.id}`);
      await fetchUsers();
      setDeleteDialogOpen(false);
      handleMenuClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) return;
    try {
      await apiClient.post('/api/admin/permission/assign-role', {
        userId: selectedUser.id,
        role: selectedRole
      });
      await fetchUsers();
      setRoleDialogOpen(false);
      setSelectedRole('');
      handleMenuClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign role');
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Blocked': return 'error';
      case 'PendingVerification': return 'warning';
      default: return 'default';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SuperAdmin': return 'error';
      case 'Admin': return 'secondary';
      case 'Moderator': return 'primary';
      default: return 'default';
    }
  };

  if (loading && users.length === 0) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          User Management
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Manage users, roles, and permissions
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            placeholder="Search users..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
            sx={{ flex: 1, maxWidth: 400 }}
          />
          {hasPermission('users:create') && (
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => navigate('/admin/users/create')}
            >
              Create User
            </Button>
          )}
          <IconButton onClick={fetchUsers}>
            <RefreshIcon />
          </IconButton>
        </Stack>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Roles</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Verified</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Last Login</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.userName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5}>
                    {user.roles.map((role) => (
                      <Chip
                        key={role}
                        label={role}
                        size="small"
                        color={getRoleColor(role) as any}
                      />
                    ))}
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.accountStatus}
                    size="small"
                    color={getStatusColor(user.accountStatus) as any}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.emailVerified ? 'Yes' : 'No'}
                    size="small"
                    color={user.emailVerified ? 'success' : 'warning'}
                  />
                </TableCell>
                <TableCell>{format(new Date(user.createdAt), 'MMM dd, yyyy')}</TableCell>
                <TableCell>
                  {user.lastLogin
                    ? format(new Date(user.lastLogin), 'MMM dd, yyyy')
                    : 'Never'}
                </TableCell>
                <TableCell align="right">
                  {/* Deaktiviere Actions für SuperAdmins, wenn der aktuelle User nur Admin ist */}
                  <IconButton
                    onClick={(e) => handleMenuOpen(e, user)}
                    size="small"
                    disabled={!isSuperAdmin && user.roles.includes('SuperAdmin')}
                    title={!isSuperAdmin && user.roles.includes('SuperAdmin') 
                      ? 'Nur SuperAdmins können andere SuperAdmins bearbeiten' 
                      : 'Aktionen'}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {hasPermission('users:update') && (
          <MenuItem onClick={() => navigate(`/admin/users/${selectedUser?.id}/edit`)}>
            <EditIcon sx={{ mr: 1 }} fontSize="small" />
            Edit User
          </MenuItem>
        )}
        {hasPermission('users:manage_roles') && (
          <MenuItem onClick={() => setRoleDialogOpen(true)}>
            <SecurityIcon sx={{ mr: 1 }} fontSize="small" />
            Manage Roles
          </MenuItem>
        )}
        {hasPermission('users:block') && selectedUser?.accountStatus !== 'Blocked' && (
          <MenuItem onClick={handleBlockUser}>
            <BlockIcon sx={{ mr: 1 }} fontSize="small" />
            Block User
          </MenuItem>
        )}
        {hasPermission('users:unblock') && selectedUser?.accountStatus === 'Blocked' && (
          <MenuItem onClick={handleUnblockUser}>
            <UnblockIcon sx={{ mr: 1 }} fontSize="small" />
            Unblock User
          </MenuItem>
        )}
        {hasPermission('users:delete') && (
          <MenuItem onClick={() => setDeleteDialogOpen(true)} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
            Delete User
          </MenuItem>
        )}
      </Menu>

      {/* Role Assignment Dialog */}
      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)}>
        <DialogTitle>Manage User Roles</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Current roles: {selectedUser?.roles.join(', ')}
          </Typography>
          {!isSuperAdmin && selectedUser?.roles.includes('SuperAdmin') ? (
            <Alert severity="warning">
              Sie können die Rollen eines SuperAdmins nicht ändern.
            </Alert>
          ) : (
            <FormControl fullWidth>
              <InputLabel>Select Role</InputLabel>
              <Select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                label="Select Role"
              >
                {availableRoles
                  .filter(role => {
                    // Filtere Rollen basierend auf Hierarchie
                    if (!isSuperAdmin && role === 'SuperAdmin') {
                      return false; // Admins können keine SuperAdmins erstellen
                    }
                    return true;
                  })
                  .map((role) => (
                    <MenuItem key={role} value={role}>
                      {role}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAssignRole} variant="contained">
            Assign Role
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user {selectedUser?.userName}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManagement;