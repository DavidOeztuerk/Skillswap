import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Button,
  Pagination,
  SelectChangeEvent,
  Tabs,
  Tab,
  OutlinedInput,
  Grid,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  RestartAlt as ResetIcon,
} from '@mui/icons-material';

import MatchCard from './MatchCard';
import SkeletonLoader from '../ui/SkeletonLoader';
import EmptyState from '../ui/EmptyState';
import { Match } from '../../types/models/Match';
import { SliceError } from '../../store/types';

interface MatchListProps {
  matches: Match[] | any[];
  isLoading?: boolean;
  error?: SliceError | null;
  isRequesterView?: boolean;
  onAccept?: (matchId: string) => void;
  onReject?: (matchId: string) => void;
  onSchedule?: (match: Match | any) => void;
}

/**
 * Komponente zur Anzeige einer Liste von Matches mit Filter- und Tab-Funktionen
 */
const MatchList: React.FC<MatchListProps> = ({
  matches,
  isLoading = false,
  error = null,
  isRequesterView = true,
  onAccept,
  onReject,
  onSchedule,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [tabValue, setTabValue] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const matchesPerPage = 8;

  // Tab-Optionen
  const tabs = [
    'Alle',
    isRequesterView ? 'Von mir erstellt' : 'Anfragen',
    isRequesterView ? 'An mich gerichtet' : 'Meine Anfragen',
    'Akzeptiert',
  ];

  // Match-Filterung
  const filteredMatches = useMemo(() => {
    if (!matches) return [];
    return matches.filter((match) => {
      // Suche
      const otherUser = isRequesterView
        ? match.requesterId === 'current-user'
          ? match.responderDetails
          : match.requesterDetails
        : match.responderId === 'current-user'
          ? match.requesterDetails
          : match.responderDetails;

      const otherUserName =
        `${otherUser.firstName} ${otherUser.lastName}`.toLowerCase();
      const skillName = match.skill.name.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        skillName?.includes(searchTerm.toLowerCase()) ||
        otherUserName?.includes(searchTerm.toLowerCase());

      // Status
      const matchesStatus = !selectedStatus || match.status === selectedStatus;

      // Tab
      let matchesTab = true;
      if (tabValue === 1) {
        // "Von mir erstellt" / "Anfragen"
        matchesTab = isRequesterView
          ? match.requesterId === 'current-user'
          : match.responderId === 'current-user' && match.status === 'Pending';
      } else if (tabValue === 2) {
        // "An mich gerichtet" / "Meine Anfragen"
        matchesTab = isRequesterView
          ? match.responderId === 'current-user'
          : match.requesterId === 'current-user';
      } else if (tabValue === 3) {
        // "Akzeptiert"
        matchesTab = match.status === 'Accepted';
      }

      return matchesSearch && matchesStatus && matchesTab;
    });
  }, [matches, searchTerm, selectedStatus, tabValue, isRequesterView]);

  // Pagination
  const pageCount = Math.ceil(filteredMatches?.length / matchesPerPage);
  const displayedMatches = filteredMatches.slice(
    (currentPage - 1) * matchesPerPage,
    currentPage * matchesPerPage
  );

  // Handler
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (event: SelectChangeEvent<string>) => {
    setSelectedStatus(event.target.value);
    setCurrentPage(1);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setCurrentPage(1);
  };

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setCurrentPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedStatus('');
    setCurrentPage(1);
  };

  // Zustand: Laden / Fehler / Keine Daten
  if (isLoading) {
    return <SkeletonLoader variant="card" count={3} />;
  }
  if (error) {
    return (
      <EmptyState
        title="Fehler beim Laden der Matches"
        description={error.message || 'Ein unbekannter Fehler ist aufgetreten'}
        actionLabel="Erneut versuchen"
        actionHandler={() => window.location.reload()}
      />
    );
  }
  if (!matches || !matches.length) {
    return (
      <EmptyState
        title="Keine Matches gefunden"
        description="Versuche, deine Suchkriterien anzupassen."
        actionLabel="Zu meinen Skills"
        actionPath="/skills"
      />
    );
  }

  return (
    <Box>
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              label={tab}
              id={`match-tab-${index}`}
              aria-controls={`match-tabpanel-${index}`}
            />
          ))}
        </Tabs>
      </Box>

      {/* Filter-Bereich */}
      <Grid container columns={12} spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <TextField
            fullWidth
            label="Suche nach Skill oder Person"
            variant="outlined"
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="status-select-label">Status</InputLabel>
              <Select
                labelId="status-select-label"
                value={selectedStatus}
                onChange={handleStatusChange}
                label="Status"
                input={
                  <OutlinedInput
                    startAdornment={
                      <InputAdornment position="start">
                        <FilterListIcon />
                      </InputAdornment>
                    }
                  />
                }
              >
                <MenuItem value="">Alle Status</MenuItem>
                <Divider />
                <MenuItem value="Pending">Ausstehend</MenuItem>
                <MenuItem value="Accepted">Akzeptiert</MenuItem>
                <MenuItem value="Rejected">Abgelehnt</MenuItem>
                <MenuItem value="Expired">Abgelaufen</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              color="inherit"
              onClick={resetFilters}
              startIcon={<ResetIcon />}
              sx={{ flexShrink: 0 }}
            >
              Zurücksetzen
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Ergebnisanzahl */}
      <Box
        mb={2}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Typography variant="body2" color="text.secondary">
          {filteredMatches?.length}{' '}
          {filteredMatches?.length === 1 ? 'Match' : 'Matches'} gefunden
        </Typography>
        {pageCount > 1 && (
          <Typography variant="body2" color="text.secondary">
            Seite {currentPage} von {pageCount}
          </Typography>
        )}
      </Box>

      {/* Matches-Grid */}
      {displayedMatches?.length > 0 ? (
        <Grid container columns={12} spacing={3}>
          {displayedMatches.map((match) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={match.id}>
              <MatchCard
                match={match}
                isRequester={match.requesterId === 'current-user'}
                onAccept={onAccept}
                onReject={onReject}
                onSchedule={onSchedule}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <EmptyState
          title="Keine passenden Matches gefunden"
          description={'Versuche, deine Suchkriterien anzupassen.'}
          actionLabel="Filter zurücksetzen"
          actionHandler={resetFilters}
        />
      )}

      {/* Pagination */}
      {pageCount > 1 && (
        <Box mt={4} display="flex" justifyContent="center">
          <Pagination
            count={pageCount}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Box>
  );
};

export default MatchList;
