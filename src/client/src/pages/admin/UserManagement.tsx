import React, { useEffect, useState, memo, useMemo, useCallback } from 'react';
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
import { usePermissions } from '../../contexts/PermissionContext';
import { format } from 'date-fns';
import { unwrap, withDefault } from '../../utils/safeAccess';
import { AdminErrorBoundary } from '../../components/error';
import errorService from '../../services/errorService';
import { useLoading, LoadingKeys } from '../../contexts/LoadingContext';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import { User } from '../../types/models/User';
import { apiClient } from '../../api/apiClient';

const UserManagement: React.FC = memo(() => {
  const navigate = useNavigate();
  const { hasPermission, isSuperAdmin, isAdmin } = usePermissions();
  const { withLoading, isLoading } = useLoading();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [_, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  
  // Use loading context for different operations
  const usersLoading = loading || isLoading(LoadingKeys.FETCH_USERS);
  
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

  // ⚡ PERFORMANCE: Memoize fetchUsers to prevent unnecessary re-creations
  const fetchUsers = useCallback(async () => {
    await withLoading(LoadingKeys.FETCH_USERS, async () => {
      try {
        setLoading(true);
        errorService.addBreadcrumb('Fetching users list', 'admin', { 
          page, 
          search: searchTerm
        });
        const response = await apiClient.get<any>('/api/admin/users', {
          params: {
            page: page + 1,
            pageSize: rowsPerPage,
            search: searchTerm
          }
        });
        
        const responseData = unwrap<any>(response);
        
        // ✅ DEFENSIVE PROGRAMMING: Ensure users is always an array
        const usersData = responseData?.items || responseData?.users || responseData;
        const usersArray = Array.isArray(usersData) ? usersData : [];
        
        console.log('📊 UserManagement: API response', { 
          responseData, 
          usersData, 
          isArray: Array.isArray(usersData),
          finalUsersArray: usersArray 
        });
        
        setUsers(usersArray);
        setTotalCount(withDefault(responseData?.totalCount, usersArray.length));
        setError(null);
      } catch (err: unknown) {
        // Handle 404 - endpoint not implemented yet
        const isAxiosError = (error: unknown): error is { response: { status: number } } => {
          return typeof error === 'object' && error !== null && 'response' in error;
        };
        
        if (isAxiosError(err) && err.response?.status === 404) {
          setUsers([]);
          setTotalCount(0);
          setError('User Management API endpoint nicht verfügbar. Diese Funktion wird nachgereicht.');
        } else {
          const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    });
  }, [withLoading, page, rowsPerPage, searchTerm]); // ⚡ PERFORMANCE: Dependencies for useCallback

  useEffect(() => {
    if (!hasPermission('users:view_all')) {
      navigate('/');
      return;
    }
    fetchUsers();
  }, [hasPermission, navigate, fetchUsers]); // ⚡ PERFORMANCE: Updated dependencies

  // ⚡ PERFORMANCE: Memoize event handlers
  const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, user: User) => {
    // Prüfe ob der aktuelle Admin diesen User bearbeiten darf
    const canEditUser = isSuperAdmin || (isAdmin && !user.roles?.includes('SuperAdmin'));
    
    if (!canEditUser) {
      setError('Sie haben keine Berechtigung, diesen Benutzer zu bearbeiten.');
      return;
    }
    
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  }, [isSuperAdmin, isAdmin, setError]);

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleBlockUser = async () => {
    if (!selectedUser) return;
    try {
      await apiClient.post(`/api/admin/users/${selectedUser.id}/block`);
      await fetchUsers();
      handleMenuClose();
    } catch (err: unknown) {
      const isAxiosError = (error: unknown): error is { response: { data: { message?: string } } } => {
        return typeof error === 'object' && error !== null && 'response' in error;
      };
      
      const errorMessage = isAxiosError(err) ? err.response?.data?.message || 'Failed to block user' :
                          err instanceof Error ? err.message : 'Failed to block user';
      setError(errorMessage);
    }
  };

  const handleUnblockUser = async () => {
    if (!selectedUser) return;
    try {
      await apiClient.post(`/api/admin/users/${selectedUser.id}/unblock`);
      await fetchUsers();
      handleMenuClose();
    } catch (err: unknown) {
      const isAxiosError = (error: unknown): error is { response: { data: { message?: string } } } => {
        return typeof error === 'object' && error !== null && 'response' in error;
      };
      
      const errorMessage = isAxiosError(err) ? err.response?.data?.message || 'Failed to unblock user' :
                          err instanceof Error ? err.message : 'Failed to unblock user';
      setError(errorMessage);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      await apiClient.delete(`/api/admin/users/${selectedUser.id}`);
      await fetchUsers();
      setDeleteDialogOpen(false);
      handleMenuClose();
    } catch (err: unknown) {
      const isAxiosError = (error: unknown): error is { response: { data: { message?: string } } } => {
        return typeof error === 'object' && error !== null && 'response' in error;
      };
      
      const errorMessage = isAxiosError(err) ? err.response?.data?.message || 'Failed to delete user' :
                          err instanceof Error ? err.message : 'Failed to delete user';
      setError(errorMessage);
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
    } catch (err: unknown) {
      const isAxiosError = (error: unknown): error is { response: { data: { message?: string } } } => {
        return typeof error === 'object' && error !== null && 'response' in error;
      };
      
      const errorMessage = isAxiosError(err) ? err.response?.data?.message || 'Failed to assign role' :
                          err instanceof Error ? err.message : 'Failed to assign role';
      setError(errorMessage);
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // ⚡ PERFORMANCE: Memoize color getter functions
  const getStatusColor = useMemo(() => (status: string) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Blocked': return 'error';
      case 'PendingVerification': return 'warning';
      default: return 'default';
    }
  }, []);

  const getRoleColor = useMemo(() => (role: string) => {
    switch (role) {
      case 'SuperAdmin': return 'error';
      case 'Admin': return 'secondary';
      case 'Moderator': return 'primary';
      default: return 'default';
    }
  }, []);

  // ⚡ PERFORMANCE: Memoize filtered and paginated users
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    
    const lowercaseSearch = searchTerm.toLowerCase();
    return users.filter(user => 
      user.userName?.toLowerCase().includes(lowercaseSearch) ||
      user.email?.toLowerCase().includes(lowercaseSearch) ||
      user.firstName?.toLowerCase().includes(lowercaseSearch) ||
      user.lastName?.toLowerCase().includes(lowercaseSearch) ||
      user.roles?.some(role => role.toLowerCase().includes(lowercaseSearch))
    );
  }, [users, searchTerm]);

  const paginatedUsers = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredUsers.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredUsers, page, rowsPerPage]);

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
        {usersLoading ? (
          <Box sx={{ p: 2 }}>
            <SkeletonLoader variant="table" count={rowsPerPage} />
          </Box>
        ) : (
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
              {paginatedUsers?.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.userName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5}>
                    {user.roles?.map((role) => (
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
                    color={getStatusColor(user.accountStatus ?? "")}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.emailVerified ? 'Yes' : 'No'}
                    size="small"
                    color={user.emailVerified ? 'success' : 'warning'}
                  />
                </TableCell>
                <TableCell>{user.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy'): 'Never'}</TableCell>
                <TableCell>
                  {user.lastLoginAt
                    ? format(new Date(user.lastLoginAt), 'MMM dd, yyyy')
                    : 'Never'}
                </TableCell>
                <TableCell align="right">
                  {/* Deaktiviere Actions für SuperAdmins, wenn der aktuelle User nur Admin ist */}
                  <IconButton
                    onClick={(e) => handleMenuOpen(e, user)}
                    size="small"
                    disabled={!isSuperAdmin && user.roles?.includes('SuperAdmin')}
                    title={!isSuperAdmin && user.roles?.includes('SuperAdmin') 
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
        )}
        {!usersLoading && (
          <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
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
            Current roles: {selectedUser?.roles?.join(', ')}
          </Typography>
          {!isSuperAdmin && selectedUser?.roles?.includes('SuperAdmin') ? (
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
});

// Export wrapped component
const UserManagementWithErrorBoundary: React.FC = () => (
  <AdminErrorBoundary>
    <UserManagement />
  </AdminErrorBoundary>
);

export default UserManagementWithErrorBoundary;