import React, { useEffect } from 'react';
import { formatDate } from 'date-fns';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
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
  TextField,
  InputAdornment,
  MenuItem,
  Stack,
  Pagination,
  IconButton,
  Tooltip,
} from '@mui/material';
import EmptyState from '../../../shared/components/ui/EmptyState';
import PageLoader from '../../../shared/components/ui/PageLoader';
import useAdmin from '../hooks/useAdmin';

interface AuditLog {
  id: string;
  timestamp: string;
  userId?: string;
  userName?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  severity?: string;
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

  // Use real data from backend
  const logs: AuditLog[] = auditLogs;

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchQuery === '' ||
      (log.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.details?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;

    return matchesSearch && matchesSeverity && matchesAction;
  });

  const getSeverityIcon = (severity: string): React.ReactElement => {
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

  const getSeverityColor = (
    severity: string
  ): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
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

  const uniqueActions = [...new Set(logs.map((log) => log.action))];

  if (isLoadingAuditLogs && logs.length === 0) {
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
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
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
              <MenuItem value="all">Alle Schweregrade</MenuItem>
              <MenuItem value="Info">Info</MenuItem>
              <MenuItem value="Success">Success</MenuItem>
              <MenuItem value="Warning">Warning</MenuItem>
              <MenuItem value="Error">Error</MenuItem>
            </TextField>
            <TextField
              select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
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
                        icon={getSeverityIcon(log.severity ?? 'Info')}
                        label={log.severity ?? 'Info'}
                        color={getSeverityColor(log.severity ?? 'Info')}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{log.userName ?? 'N/A'}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {log.userId?.slice(0, 8) ?? 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={log.action} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{log.entityType ?? 'N/A'}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {log.entityId?.slice(0, 8) ?? 'N/A'}
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
            onChange={(_, value) => {
              setPage(value);
            }}
            color="primary"
          />
        </Box>
      </Card>
    </Box>
  );
};

export default AdminAuditLogsPage;
