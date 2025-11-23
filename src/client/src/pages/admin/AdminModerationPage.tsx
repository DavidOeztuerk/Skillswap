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
  Button,
  IconButton,
  Stack,
  TextField,
  InputAdornment,
  MenuItem,
  Grid,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAdmin } from '../../hooks/useAdmin';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate } from '../../utils/dateUtils';

interface ModerationItem {
  id: string;
  type: 'inappropriate-content' | 'spam' | 'harassment' | 'fake-profile' | 'copyright' | 'other' | 'User' | 'Skill' | 'Comment' | 'Review';
  reportedBy?: string;
  reportedByName?: string;
  reportedUser?: string;
  reportedUserName?: string;
  reason?: string;
  content?: string;
  status: 'pending' | 'approved' | 'rejected' | 'escalated' | 'Pending' | 'Approved' | 'Rejected' | 'Flagged';
  severity?: 'Low' | 'Medium' | 'High' | 'Critical';
  createdAt: string;
}

const AdminModerationPage: React.FC = () => {
  const { moderationReports, isLoadingReports, fetchModerationReports } = useAdmin();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('Pending');
  const [typeFilter, setTypeFilter] = React.useState<string>('all');
  const [selectedItem, setSelectedItem] = React.useState<ModerationItem | null>(null);
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  useEffect(() => {
    fetchModerationReports({ filters: { status: statusFilter === 'all' ? undefined : statusFilter } });
  }, [fetchModerationReports, statusFilter]);

  // Mock data if no moderationReports from backend
  const mockQueue: ModerationItem[] = moderationReports || [
    {
      id: '1',
      type: 'User',
      reportedBy: 'user123',
      reportedByName: 'Max Mustermann',
      reportedUser: 'user456',
      reportedUserName: 'Suspicious User',
      reason: 'Spam-Verhalten',
      content: 'Nutzer sendet wiederholt unangemessene Nachrichten',
      status: 'Pending',
      severity: 'High',
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: '2',
      type: 'Skill',
      reportedBy: 'user789',
      reportedByName: 'Erika Musterfrau',
      reportedUser: 'user012',
      reportedUserName: 'John Doe',
      reason: 'Unangemessener Inhalt',
      content: 'Skill-Beschreibung enthält unpassende Sprache',
      status: 'Pending',
      severity: 'Medium',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: '3',
      type: 'Comment',
      reportedBy: 'user345',
      reportedByName: 'Anna Schmidt',
      reportedUser: 'user678',
      reportedUserName: 'Bob Johnson',
      reason: 'Beleidigung',
      content: 'Kommentar enthält beleidigende Aussagen',
      status: 'Pending',
      severity: 'Critical',
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: '4',
      type: 'Review',
      reportedBy: 'user901',
      reportedByName: 'Lisa Müller',
      reportedUser: 'user234',
      reportedUserName: 'Tom Brown',
      reason: 'Falsche Bewertung',
      content: 'Bewertung scheint gefälscht zu sein',
      status: 'Flagged',
      severity: 'Low',
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    },
  ];

  const filteredQueue = mockQueue.filter((item) => {
    const matchesSearch =
      searchQuery === '' ||
      item.reportedUserName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesType = typeFilter === 'all' || item.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: mockQueue.length,
    pending: mockQueue.filter((i) => i.status === 'Pending').length,
    approved: mockQueue.filter((i) => i.status === 'Approved').length,
    rejected: mockQueue.filter((i) => i.status === 'Rejected').length,
    flagged: mockQueue.filter((i) => i.status === 'Flagged').length,
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Low':
        return 'info';
      case 'Medium':
        return 'warning';
      case 'High':
        return 'error';
      case 'Critical':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'warning';
      case 'Approved':
        return 'success';
      case 'Rejected':
        return 'error';
      case 'Flagged':
        return 'info';
      default:
        return 'default';
    }
  };

  const handleViewDetails = (item: ModerationItem) => {
    setSelectedItem(item);
    setDetailsOpen(true);
  };

  const handleApprove = (id: string) => {
    console.log('Approving item:', id);
    // TODO: Implement approve action
  };

  const handleReject = (id: string) => {
    console.log('Rejecting item:', id);
    // TODO: Implement reject action
  };

  if (isLoadingReports && !moderationReports) {
    return <PageLoader variant="list" message="Lade Moderationswarteschlange..." />;
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Content Moderation
      </Typography>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3, md: 2.4 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Gesamt
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3, md: 2.4 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Ausstehend
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.pending}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3, md: 2.4 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Genehmigt
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.approved}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, sm: 3, md: 2.4 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Abgelehnt
              </Typography>
              <Typography variant="h4" color="error.main">
                {stats.rejected}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 12, md: 2.4 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Markiert
              </Typography>
              <Typography variant="h4" color="info.main">
                {stats.flagged}
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
              placeholder="Suche nach Nutzer, Grund oder Inhalt..."
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ minWidth: 150 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterIcon />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="all">Alle Status</MenuItem>
              <MenuItem value="Pending">Ausstehend</MenuItem>
              <MenuItem value="Approved">Genehmigt</MenuItem>
              <MenuItem value="Rejected">Abgelehnt</MenuItem>
              <MenuItem value="Flagged">Markiert</MenuItem>
            </TextField>
            <TextField
              select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              sx={{ minWidth: 150 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterIcon />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="all">Alle Typen</MenuItem>
              <MenuItem value="User">Nutzer</MenuItem>
              <MenuItem value="Skill">Skill</MenuItem>
              <MenuItem value="Comment">Kommentar</MenuItem>
              <MenuItem value="Review">Bewertung</MenuItem>
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      {/* Moderation Queue Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Typ</TableCell>
                <TableCell>Gemeldeter Nutzer</TableCell>
                <TableCell>Gemeldet von</TableCell>
                <TableCell>Grund</TableCell>
                <TableCell>Schweregrad</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Erstellt am</TableCell>
                <TableCell align="center">Aktionen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredQueue.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <EmptyState
                      title="Keine Moderationseinträge gefunden"
                      description="Es wurden keine Einträge mit den aktuellen Filterkriterien gefunden."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredQueue.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Chip label={item.type} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body2">{item.reportedUserName || 'N/A'}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {item.reportedUser?.substring(0, 8) || 'N/A'}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.reportedByName || 'N/A'}</Typography>
                    </TableCell>
                    <TableCell>{item.reason || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.severity || 'N/A'}
                        color={getSeverityColor(item.severity || 'Low') as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={item.status}
                        color={getStatusColor(item.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(item.createdAt, 'dd.MM.yyyy HH:mm')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleViewDetails(item)}
                        >
                          <ViewIcon />
                        </IconButton>
                        {item.status === 'Pending' && (
                          <>
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleApprove(item.id)}
                            >
                              <ApproveIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleReject(item.id)}
                            >
                              <RejectIcon />
                            </IconButton>
                          </>
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

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Moderationsdetails</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Typ
                </Typography>
                <Chip label={selectedItem.type} size="small" />
              </Box>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Gemeldeter Nutzer
                </Typography>
                <Typography>{selectedItem.reportedUserName}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Gemeldet von
                </Typography>
                <Typography>{selectedItem.reportedByName}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Grund
                </Typography>
                <Typography>{selectedItem.reason || 'N/A'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Inhalt
                </Typography>
                <Typography>{selectedItem.content || 'N/A'}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Schweregrad
                </Typography>
                <Chip
                  label={selectedItem.severity || 'N/A'}
                  color={getSeverityColor(selectedItem.severity || 'Low') as any}
                  size="small"
                />
              </Box>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Status
                </Typography>
                <Chip
                  label={selectedItem.status}
                  color={getStatusColor(selectedItem.status) as any}
                  size="small"
                />
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Schließen</Button>
          {selectedItem?.status === 'Pending' && (
            <>
              <Button
                variant="contained"
                color="success"
                startIcon={<ApproveIcon />}
                onClick={() => {
                  handleApprove(selectedItem.id);
                  setDetailsOpen(false);
                }}
              >
                Genehmigen
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<RejectIcon />}
                onClick={() => {
                  handleReject(selectedItem.id);
                  setDetailsOpen(false);
                }}
              >
                Ablehnen
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminModerationPage;
