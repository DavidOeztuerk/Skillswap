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
  Grid,
  TextField,
  InputAdornment,
  MenuItem,
  Stack,
} from '@mui/material';
import { Search as SearchIcon, FilterList as FilterIcon } from '@mui/icons-material';
import { useMatchmaking } from '../../hooks/useMatchmaking';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/ui/EmptyState';

const AdminMatchesPage: React.FC = () => {
  const { matches, isLoading, loadMatches } = useMatchmaking();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');

  useEffect(() => {
    loadMatches({ pageNumber: 1, pageSize: 100 });
  }, [loadMatches]);

  const filteredMatches = matches.filter((match) => {
    const matchesSearch =
      searchQuery === '' ||
      match.offeredSkill?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.requestedSkill?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || match.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'accepted':
      case 'active':
        return 'success';
      case 'rejected':
        return 'error';
      case 'completed':
        return 'info';
      default:
        return 'default';
    }
  };

  const stats = {
    total: matches.length,
    pending: matches.filter((m) => m.status === 'pending').length,
    accepted: matches.filter((m) => m.status === 'accepted').length,
    completed: matches.filter((m) => m.status === 'completed').length,
    rejected: matches.filter((m) => m.status === 'rejected').length,
  };

  if (isLoading && matches.length === 0) {
    return <PageLoader variant="list" message="Lade Matches..." />;
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Matches-Verwaltung
      </Typography>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Gesamt
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
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
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Akzeptiert
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.accepted}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Abgeschlossen
              </Typography>
              <Typography variant="h4" color="info.main">
                {stats.completed}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
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
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              placeholder="Suche nach Skills..."
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
              sx={{ minWidth: 200 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterIcon />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="all">Alle Status</MenuItem>
              <MenuItem value="pending">Ausstehend</MenuItem>
              <MenuItem value="accepted">Akzeptiert</MenuItem>
              <MenuItem value="completed">Abgeschlossen</MenuItem>
              <MenuItem value="rejected">Abgelehnt</MenuItem>
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      {/* Matches Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Angebotener Skill</TableCell>
                <TableCell>Gesuchter Skill</TableCell>
                <TableCell>Nutzer 1</TableCell>
                <TableCell>Nutzer 2</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Kompatibilität</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMatches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyState
                      title="Keine Matches gefunden"
                      description="Es wurden keine Matches mit den aktuellen Filterkriterien gefunden."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredMatches.map((match) => (
                  <TableRow key={match.id}>
                    <TableCell>{match.id.substring(0, 8)}...</TableCell>
                    <TableCell>{match.offeredSkill?.name || 'N/A'}</TableCell>
                    <TableCell>{match.requestedSkill?.name || 'N/A'}</TableCell>
                    <TableCell>{match.user1Id?.substring(0, 8) || 'N/A'}</TableCell>
                    <TableCell>{match.user2Id?.substring(0, 8) || 'N/A'}</TableCell>
                    <TableCell>
                      <Chip
                        label={match.status}
                        color={getStatusColor(match.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {match.compatibilityScore ? `${match.compatibilityScore}%` : 'N/A'}
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

export default AdminMatchesPage;