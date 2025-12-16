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
  type SelectChangeEvent,
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
import type { MatchDisplay } from '../../types/contracts/MatchmakingDisplay';
import { useAppSelector } from '../../store/store.hooks';
import { selectAuthUser } from '../../store/selectors/authSelectors';

interface MatchListProps {
  matches: MatchDisplay[];
  isLoading?: boolean;
  errorMessage?: string | null;
  isRequesterView?: boolean;
  onAccept?: (matchId: string) => void;
  onReject?: (matchId: string) => void;
  onSchedule?: (match: MatchDisplay) => void;
}

/**
 * Komponente zur Anzeige einer Liste von Matches mit Filter- und Tab-Funktionen
 */
const MatchList: React.FC<MatchListProps> = ({
  matches,
  isLoading = false,
  errorMessage = null,
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

  // Get current user ID for proper filtering
  const currentUser = useAppSelector(selectAuthUser);
  const currentUserId = currentUser?.id;

  // Tab-Optionen
  const tabs = [
    'Alle',
    isRequesterView ? 'Von mir erstellt' : 'Anfragen',
    isRequesterView ? 'An mich gerichtet' : 'Meine Anfragen',
    'Akzeptiert',
  ];

  // Match-Filterung
  const filteredMatches = useMemo(() => {
    console.debug('🔍 MatchList: Processing matches', {
      matchesCount: matches.length,
      matches,
      currentUserId,
      tabValue,
      searchTerm,
      selectedStatus,
    });

    if (matches.length === 0) {
      console.debug('❌ MatchList: No matches provided');
      return [];
    }

    return matches.filter((match) => {
      // Suche - Use backend response format
      const matchesSearch =
        searchTerm.length === 0 ||
        match.skillName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        match.partnerName.toLowerCase().includes(searchTerm.toLowerCase());

      // Status - Case-insensitive matching
      const matchesStatus =
        selectedStatus.length === 0 || match.status.toLowerCase() === selectedStatus.toLowerCase();

      // Tab - Use new backend response format with case-insensitive status
      let matchesTab = true;
      const status = match.status.toLowerCase();

      if (tabValue === 1) {
        // "Von mir erstellt" / "Anfragen"
        matchesTab = isRequesterView
          ? match.requesterId === currentUserId
          : match.responderId === currentUserId && status === 'pending';
      } else if (tabValue === 2) {
        // "An mich gerichtet" / "Meine Anfragen"
        matchesTab = isRequesterView
          ? match.responderId === currentUserId
          : match.requesterId === currentUserId;
      } else if (tabValue === 3) {
        // "Akzeptiert"
        matchesTab = status === 'accepted';
      }

      const passesFilter = matchesSearch && matchesStatus && matchesTab;

      if (!passesFilter) {
        console.debug('🚫 MatchList: Match filtered out', {
          matchId: match.id,
          matchesSearch,
          matchesStatus,
          matchesTab,
          status: match.status,
          requesterId: match.requesterId,
          currentUserId,
        });
      }

      return passesFilter;
    });
  }, [matches, searchTerm, selectedStatus, tabValue, isRequesterView, currentUserId]);

  // Pagination
  const pageCount = Math.ceil(filteredMatches.length / matchesPerPage);
  const displayedMatches = filteredMatches.slice(
    (currentPage - 1) * matchesPerPage,
    currentPage * matchesPerPage
  );

  console.debug('📊 MatchList: Final results', {
    totalMatches: matches.length,
    filteredMatches: filteredMatches.length,
    displayedMatches: displayedMatches.length,
    currentPage,
    pageCount,
  });

  // Handler
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (event: SelectChangeEvent): void => {
    setSelectedStatus(event.target.value);
    setCurrentPage(1);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number): void => {
    setTabValue(newValue);
    setCurrentPage(1);
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number): void => {
    setCurrentPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFilters = (): void => {
    setSearchTerm('');
    setSelectedStatus('');
    setCurrentPage(1);
  };

  if (isLoading) {
    return <SkeletonLoader variant="card" count={3} />;
  }
  if (errorMessage) {
    return (
      <EmptyState
        title="Fehler beim Laden der Matches"
        description={errorMessage}
        actionLabel="Erneut versuchen"
        actionHandler={() => {
          window.location.reload();
        }}
      />
    );
  }
  if (matches.length === 0) {
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
              id={`match-tab-${String(index)}`}
              aria-controls={`match-tabpanel-${String(index)}`}
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
                <MenuItem value="pending">Ausstehend</MenuItem>
                <MenuItem value="accepted">Akzeptiert</MenuItem>
                <MenuItem value="rejected">Abgelehnt</MenuItem>
                <MenuItem value="expired">Abgelaufen</MenuItem>
                <MenuItem value="completed">Abgeschlossen</MenuItem>
                <MenuItem value="cancelled">Abgebrochen</MenuItem>
                <MenuItem value="active">Aktiv</MenuItem>
                <MenuItem value="dissolved">Aufgelöst</MenuItem>
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
      <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" color="text.secondary">
          {String(filteredMatches.length)} {filteredMatches.length === 1 ? 'Match' : 'Matches'}{' '}
          gefunden
        </Typography>
        {pageCount > 1 && (
          <Typography variant="body2" color="text.secondary">
            Seite {String(currentPage)} von {String(pageCount)}
          </Typography>
        )}
      </Box>

      {/* Matches-Grid */}
      {displayedMatches.length > 0 ? (
        <Grid container columns={12} spacing={3}>
          {displayedMatches.map((match) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={match.id}>
              <MatchCard
                match={match}
                isRequester={match.requesterId === currentUserId}
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
