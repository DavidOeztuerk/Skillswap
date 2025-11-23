import React, { useEffect } from 'react';
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
  TextField,
  InputAdornment,
  MenuItem,
  Stack,
  Pagination,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import { useAdmin } from '../../hooks/useAdmin';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate } from '../../utils/dateUtils';

interface AuditLog {
  id: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  severity?: 'Info' | 'Warning' | 'Error' | 'Success' | string;
  ipAddress: string;
  userAgent: string;
  details?: string;
}

const AdminAuditLogsPage: React.FC = () => {
  const { auditLogs, isLoadingAuditLogs, fetchAuditLogs } = useAdmin();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [severityFilter, setSeverityFilter] = React.useState<string>('all');
  const [actionFilter, setActionFilter] = React.useState<string>('all');
  const [page, setPage] = React.useState(1);
  const pageSize = 20;

  useEffect(() => {
    fetchAuditLogs({ page, limit: pageSize });
  }, [fetchAuditLogs, page]);

  // Mock data if no auditLogs from backend
  const mockLogs: AuditLog[] = auditLogs || [
    {
      id: '1',
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      userId: 'user123',
      userName: 'Max Mustermann',
      action: 'Login',
      entityType: 'User',
      entityId: 'user123',
      severity: 'Info',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0',
      details: 'Successful login',
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      userId: 'admin456',
      userName: 'Admin User',
      action: 'DeleteSkill',
      entityType: 'Skill',
      entityId: 'skill789',
      severity: 'Warning',
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0',
      details: 'Skill "JavaScript Advanced" deleted',
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      userId: 'user789',
      userName: 'Erika Musterfrau',
      action: 'FailedLogin',
      entityType: 'User',
      entityId: 'user789',
      severity: 'Error',
      ipAddress: '192.168.1.102',
      userAgent: 'Mozilla/5.0',
      details: 'Invalid password attempt',
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      userId: 'user456',
      userName: 'John Doe',
      action: 'CreateMatch',
      entityType: 'Match',
      entityId: 'match123',
      severity: 'Success',
      ipAddress: '192.168.1.103',
      userAgent: 'Mozilla/5.0',
      details: 'Match created successfully',
    },
    {
      id: '5',
      timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      userId: 'admin789',
      userName: 'Super Admin',
      action: 'UpdateSystemSettings',
      entityType: 'Settings',
      entityId: 'settings1',
      severity: 'Warning',
      ipAddress: '192.168.1.104',
      userAgent: 'Mozilla/5.0',
      details: 'System settings modified',
    },
  ];

  const filteredLogs = mockLogs.filter((log) => {
    const matchesSearch =
      searchQuery === '' ||
      log.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;

    return matchesSearch && matchesSeverity && matchesAction;
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'Info':
        return <InfoIcon color="info" />;
      case 'Warning':
        return <WarningIcon color="warning" />;
      case 'Error':
        return <ErrorIcon color="error" />;
      case 'Success':
        return <SuccessIcon color="success" />;
      default:
        return <InfoIcon />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Info':
        return 'info';
      case 'Warning':
        return 'warning';
      case 'Error':
        return 'error';
      case 'Success':
        return 'success';
      default:
        return 'default';
    }
  };

  const uniqueActions = Array.from(new Set(mockLogs.map((log) => log.action)));

  if (isLoadingAuditLogs && !auditLogs) {
    return <PageLoader variant="list" message="Lade Audit Logs..." />;
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Audit Logs
      </Typography>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              placeholder="Suche nach Nutzer, Aktion oder Details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flexGrow: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              sx={{ minWidth: 150 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterIcon />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="all">Alle Schweregrade</MenuItem>
              <MenuItem value="Info">Info</MenuItem>
              <MenuItem value="Success">Success</MenuItem>
              <MenuItem value="Warning">Warning</MenuItem>
              <MenuItem value="Error">Error</MenuItem>
            </TextField>
            <TextField
              select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              sx={{ minWidth: 150 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterIcon />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="all">Alle Aktionen</MenuItem>
              {uniqueActions.map((action) => (
                <MenuItem key={action} value={action}>
                  {action}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Zeitstempel</TableCell>
                <TableCell>Schweregrad</TableCell>
                <TableCell>Nutzer</TableCell>
                <TableCell>Aktion</TableCell>
                <TableCell>Entität</TableCell>
                <TableCell>IP-Adresse</TableCell>
                <TableCell>Details</TableCell>
                <TableCell align="center">Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <EmptyState
                      title="Keine Audit Logs gefunden"
                      description="Es wurden keine Audit Logs mit den aktuellen Filterkriterien gefunden."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(log.timestamp, 'dd.MM.yyyy')}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {formatDate(log.timestamp, 'HH:mm:ss')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getSeverityIcon(log.severity || 'Info')}
                        label={log.severity || 'Info'}
                        color={getSeverityColor(log.severity || 'Info') as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{log.userName || 'N/A'}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {log.userId?.substring(0, 8) || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={log.action} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{log.entityType || 'N/A'}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {log.entityId?.substring(0, 8) || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{log.ipAddress}</Typography>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={log.userAgent}>
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {log.details}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="primary">
                        <ViewIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box display="flex" justifyContent="center" p={2}>
          <Pagination
            count={Math.ceil(filteredLogs.length / pageSize)}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      </Card>
    </Box>
  );
};

export default AdminAuditLogsPage;
