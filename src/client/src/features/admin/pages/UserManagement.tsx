import React, { useState, memo, useMemo, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Block as BlockIcon,
  LockOpen as UnblockIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  PersonAdd as PersonAddIcon,
  Security as SecurityIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
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
  Stack,
} from '@mui/material';
import { usePermissions } from '../../../core/contexts/permissionContextHook';
import errorService from '../../../core/services/errorService';
import { useAppDispatch, useAppSelector } from '../../../core/store/store.hooks';
import AdminErrorBoundary from '../../../shared/components/error/AdminErrorBoundary';
import SkeletonLoader from '../../../shared/components/ui/SkeletonLoader';
import {
  selectAdminUsers,
  selectUsersPagination,
  selectIsLoadingUsers,
  selectUserError,
} from '../store/adminSelectors';
import {
  fetchAdminUsers,
  updateUserRole,
  suspendUser,
  unsuspendUser,
  deleteUser,
} from '../store/adminThunks';
import type { AdminUser } from '../types/Admin';

const UserManagement: React.FC = memo(() => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { hasPermission, isSuperAdmin, isAdmin } = usePermissions();

  // Redux state
  const users = useAppSelector(selectAdminUsers);
  const pagination = useAppSelector(selectUsersPagination);
  const loading = useAppSelector(selectIsLoadingUsers);
  const reduxError = useAppSelector(selectUserError);
  const totalCount = pagination.total;

  // Local UI state
  const [localError, setLocalError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Combine Redux error with local error
  const error = localError ?? reduxError;

  const availableRoles = useMemo(() => {
    if (isSuperAdmin) {
      return ['User', 'Moderator', 'Admin', 'SuperAdmin'];
    }
    if (isAdmin) {
      return ['User', 'Moderator', 'Admin'];
    }
    return ['User'];
  }, [isSuperAdmin, isAdmin]);

  const fetchUsers = useCallback(async () => {
    errorService.addBreadcrumb('Fetching users list', 'admin', {
      page,
      search: searchTerm,
    });

    await dispatch(
      fetchAdminUsers({
        page: page + 1,
        limit: rowsPerPage,
        filters: searchTerm ? { search: searchTerm } : undefined,
      })
    );
  }, [dispatch, page, rowsPerPage, searchTerm]);

  useEffect(() => {
    const initialize = async (): Promise<void> => {
      if (!hasPermission('users:view_all')) {
        await navigate('/');
        return;
      }
      await fetchUsers();
    };

    initialize().catch(() => {});
  }, [hasPermission, navigate, fetchUsers]);

  const handleMenuOpen = useCallback(
    (event: React.MouseEvent<HTMLElement>, user: AdminUser) => {
      const canEditUser = isSuperAdmin || (isAdmin && !user.roles.includes('SuperAdmin'));

      if (!canEditUser) {
        setLocalError('Sie haben keine Berechtigung, diesen Benutzer zu bearbeiten.');
        return;
      }

      setAnchorEl(event.currentTarget);
      setSelectedUser(user);
    },
    [isSuperAdmin, isAdmin]
  );

  const handleMenuClose = (): void => {
    setAnchorEl(null);
  };

  const handleBlockUser = async (): Promise<void> => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await dispatch(
        suspendUser({
          userId: selectedUser.id,
          reason: 'Suspended by admin',
        })
      ).unwrap();
      await fetchUsers();
      handleMenuClose();
      setLocalError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to block user';
      setLocalError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblockUser = async (): Promise<void> => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await dispatch(unsuspendUser(selectedUser.id)).unwrap();
      await fetchUsers();
      handleMenuClose();
      setLocalError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to unblock user';
      setLocalError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (): Promise<void> => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await dispatch(deleteUser(selectedUser.id)).unwrap();
      await fetchUsers();
      setDeleteDialogOpen(false);
      handleMenuClose();
      setLocalError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete user';
      setLocalError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignRole = async (): Promise<void> => {
    if (!selectedUser || !selectedRole) return;
    setActionLoading(true);
    try {
      await dispatch(
        updateUserRole({
          userId: selectedUser.id,
          role: selectedRole,
        })
      ).unwrap();
      await fetchUsers();
      setRoleDialogOpen(false);
      setSelectedRole('');
      handleMenuClose();
      setLocalError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to assign role';
      setLocalError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangePage = (_event: unknown, newPage: number): void => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setRowsPerPage(Number.parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = useMemo(
    () =>
      (status: string): 'success' | 'error' | 'warning' | 'default' => {
        switch (status) {
          case 'Active':
            return 'success';
          case 'Blocked':
          case 'Suspended':
            return 'error';
          case 'PendingVerification':
            return 'warning';
          default:
            return 'default';
        }
      },
    []
  );

  const getRoleColor = useMemo(
    () =>
      (role: string): 'error' | 'secondary' | 'primary' | 'default' => {
        switch (role) {
          case 'SuperAdmin':
            return 'error';
          case 'Admin':
            return 'secondary';
          case 'Moderator':
            return 'primary';
          default:
            return 'default';
        }
      },
    []
  );

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;

    const lowercaseSearch = searchTerm.toLowerCase();
    return users.filter(
      (user) =>
        user.userName.toLowerCase().includes(lowercaseSearch) ||
        user.email.toLowerCase().includes(lowercaseSearch) ||
        user.firstName.toLowerCase().includes(lowercaseSearch) ||
        user.lastName.toLowerCase().includes(lowercaseSearch) ||
        user.roles.some((role) => role.toLowerCase().includes(lowercaseSearch))
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

      {error ? (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          onClose={() => {
            setLocalError(null);
          }}
        >
          {error}
        </Alert>
      ) : null}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            placeholder="Search users..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
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
          <IconButton
            onClick={() => {
              void fetchUsers();
            }}
            disabled={loading}
          >
            <RefreshIcon />
          </IconButton>
        </Stack>
      </Paper>

      <TableContainer component={Paper}>
        {loading ? (
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
              {paginatedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.userName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      {user.roles.map((role) => (
                        <Chip key={role} label={role} size="small" color={getRoleColor(role)} />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.accountStatus}
                      size="small"
                      color={getStatusColor(user.accountStatus)}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.emailVerified ? 'Yes' : 'No'}
                      size="small"
                      color={user.emailVerified ? 'success' : 'warning'}
                    />
                  </TableCell>
                  <TableCell>
                    {user.createdAt ? format(new Date(user.createdAt), 'MMM dd, yyyy') : 'Never'}
                  </TableCell>
                  <TableCell>
                    {user.lastLoginAt
                      ? format(new Date(user.lastLoginAt), 'MMM dd, yyyy')
                      : 'Never'}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={(e) => {
                        handleMenuOpen(e, user);
                      }}
                      size="small"
                      disabled={!isSuperAdmin && user.roles.includes('SuperAdmin')}
                      title={
                        !isSuperAdmin && user.roles.includes('SuperAdmin')
                          ? 'Nur SuperAdmins können andere SuperAdmins bearbeiten'
                          : 'Aktionen'
                      }
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!loading && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalCount > 0 ? totalCount : filteredUsers.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
      </TableContainer>

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        {hasPermission('users:update') && selectedUser ? (
          <MenuItem onClick={() => navigate(`/admin/users/${selectedUser.id}/edit`)}>
            <EditIcon sx={{ mr: 1 }} fontSize="small" />
            Edit User
          </MenuItem>
        ) : null}
        {hasPermission('users:manage_roles') && (
          <MenuItem
            onClick={() => {
              setRoleDialogOpen(true);
            }}
          >
            <SecurityIcon sx={{ mr: 1 }} fontSize="small" />
            Manage Roles
          </MenuItem>
        )}
        {hasPermission('users:block') && selectedUser?.accountStatus !== 'suspended' && (
          <MenuItem
            onClick={() => {
              void handleBlockUser();
            }}
            disabled={actionLoading}
          >
            <BlockIcon sx={{ mr: 1 }} fontSize="small" />
            Block User
          </MenuItem>
        )}
        {hasPermission('users:unblock') && selectedUser?.accountStatus === 'suspended' && (
          <MenuItem
            onClick={() => {
              void handleUnblockUser();
            }}
            disabled={actionLoading}
          >
            <UnblockIcon sx={{ mr: 1 }} fontSize="small" />
            Unblock User
          </MenuItem>
        )}
        {hasPermission('users:delete') && (
          <MenuItem
            onClick={() => {
              setDeleteDialogOpen(true);
            }}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
            Delete User
          </MenuItem>
        )}
      </Menu>

      {/* Role Assignment Dialog */}
      <Dialog
        open={roleDialogOpen}
        onClose={() => {
          setRoleDialogOpen(false);
        }}
      >
        <DialogTitle>Manage User Roles</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Current roles: {selectedUser?.roles.join(', ')}
          </Typography>
          {!isSuperAdmin && selectedUser?.roles.includes('SuperAdmin') ? (
            <Alert severity="warning">Sie können die Rollen eines SuperAdmins nicht ändern.</Alert>
          ) : (
            <FormControl fullWidth>
              <InputLabel>Select Role</InputLabel>
              <Select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                }}
                label="Select Role"
              >
                {availableRoles
                  .filter((role) => isSuperAdmin || role !== 'SuperAdmin')
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
          <Button
            onClick={() => {
              setRoleDialogOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              void handleAssignRole();
            }}
            variant="contained"
            disabled={actionLoading || !selectedRole}
          >
            {actionLoading ? 'Assigning...' : 'Assign Role'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
        }}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user {selectedUser?.userName}? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              void handleDeleteUser();
            }}
            color="error"
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
});

UserManagement.displayName = 'UserManagement';

const UserManagementWithErrorBoundary: React.FC = () => (
  <AdminErrorBoundary>
    <UserManagement />
  </AdminErrorBoundary>
);

export default UserManagementWithErrorBoundary;
