import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  IconButton,
  Tooltip,
  TablePagination,
  Stack,
  TextField,
  InputAdornment,
  Typography,
} from '@mui/material';
import { Visibility, Download } from '@mui/icons-material';
import { useAppSelector } from '../../store/store.hooks';
import type { SessionStatus } from '../../features/sessions/sessionsSlice';

interface SessionHistoryTableProps {
  onViewDetails?: (session: SessionStatus) => void;
  onExport?: (sessions: SessionStatus[]) => void;
}

/**
 * SessionHistoryTable Component
 *
 * Displays a paginated table of session history with:
 * - Session information (ID, status, date)
 * - Sorting and filtering
 * - View details action
 * - Export functionality
 * - Status badges
 */
const SessionHistoryTable: React.FC<SessionHistoryTableProps> = ({ onViewDetails, onExport }) => {
  const { sessionHistory } = useAppSelector((state) => state.sessions);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Filter sessions based on search and status
  const filteredSessions = sessionHistory.filter((session: SessionStatus) => {
    const matchesSearch =
      session.sessionAppointmentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ((session.timestamp ?? null) !== null &&
        new Date(session.timestamp ?? '').toLocaleDateString().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || session.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Get unique statuses for filter
  const uniqueStatuses = Array.from(new Set(sessionHistory.map((s: SessionStatus) => s.status)));

  // Paginate
  const paginatedSessions = filteredSessions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (_event: unknown, newPage: number): void => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (
    status: string
  ): 'default' | 'primary' | 'success' | 'error' | 'warning' => {
    switch (status.toLowerCase()) {
      case 'pending':
      case 'inprogress':
        return 'warning';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'noshow':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleExport = (): void => {
    onExport?.(filteredSessions);
  };

  const formatDate = (dateString?: string | null): string => {
    if ((dateString ?? null) === null) return 'N/A';
    try {
      return new Date(dateString ?? '').toLocaleString('en-DE');
    } catch {
      return 'Invalid date';
    }
  };

  if (sessionHistory.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="textSecondary">No sessions recorded yet</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }} alignItems="center">
        <TextField
          size="small"
          placeholder="Search by ID or date..."
          value={searchTerm}
          onChange={(e): void => {
            setSearchTerm(e.target.value);
            setPage(0);
          }}
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start">🔍</InputAdornment>,
            },
          }}
          sx={{ flex: 1 }}
        />

        <Box>
          <select
            value={statusFilter}
            onChange={(e): void => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ccc',
              fontSize: '0.875rem',
            }}
          >
            <option value="All">All Status</option>
            {uniqueStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Box>

        {onExport && (
          <Tooltip title="Export sessions">
            <span>
              <IconButton
                size="small"
                onClick={handleExport}
                disabled={filteredSessions.length === 0}
              >
                <Download fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Stack>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>Session ID</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date & Time</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedSessions.map((session: SessionStatus) => (
              <TableRow key={session.sessionAppointmentId} hover>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {session.sessionAppointmentId.substring(0, 16)}...
                </TableCell>
                <TableCell>
                  <Chip
                    label={session.status}
                    color={getStatusColor(session.status)}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{formatDate(session.timestamp)}</TableCell>
                <TableCell align="center">
                  {onViewDetails && (
                    <Tooltip title="View details">
                      <IconButton
                        size="small"
                        onClick={() => {
                          onViewDetails(session);
                        }}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {paginatedSessions.length === 0 && (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="textSecondary">No sessions match your filters</Typography>
          </Box>
        )}
      </TableContainer>

      {/* Pagination */}
      {filteredSessions.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredSessions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}

      {/* Summary */}
      <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="caption" color="textSecondary">
          Showing {String(paginatedSessions.length > 0 ? page * rowsPerPage + 1 : 0)}-
          {String(Math.min((page + 1) * rowsPerPage, filteredSessions.length))} of{' '}
          {String(filteredSessions.length)} sessions
        </Typography>
      </Box>
    </Box>
  );
};

export default SessionHistoryTable;
