import React, { memo, useMemo, useCallback } from 'react';
import { FilterList as FilterIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import {
  Box,
  Typography,
  Stack,
  Pagination,
  LinearProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Button,
  Chip,
} from '@mui/material';
import {
  type SecurityAlertResponse,
  SecurityAlertLevel,
  SecurityAlertType,
} from '../../notifications/types/SecurityAlert';
import SecurityAlertCard from './SecurityAlertCard';

interface SecurityAlertListProps {
  alerts: SecurityAlertResponse[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  isLoading?: boolean;
  error?: string;
  onPageChange: (page: number) => void;
  onDismiss?: (alertId: string, reason: string) => void;
  onMarkRead?: (alertId: string) => void;
  onViewDetails?: (alertId: string) => void;
  onRefresh?: () => void;
  // Filters
  minLevel?: string;
  onMinLevelChange?: (level: string) => void;
  alertType?: string;
  onAlertTypeChange?: (type: string) => void;
  includeRead?: boolean;
  onIncludeReadChange?: (include: boolean) => void;
  includeDismissed?: boolean;
  onIncludeDismissedChange?: (include: boolean) => void;
}

const SecurityAlertList: React.FC<SecurityAlertListProps> = memo(
  ({
    alerts,
    totalCount,
    currentPage,
    pageSize,
    isLoading,
    error,
    onPageChange,
    onDismiss,
    onMarkRead,
    onViewDetails,
    onRefresh,
    minLevel,
    onMinLevelChange,
    alertType,
    onAlertTypeChange,
    includeRead,
    onIncludeReadChange,
    includeDismissed,
    onIncludeDismissedChange,
  }) => {
    const [showFilters, setShowFilters] = React.useState(false);

    const totalPages = useMemo(() => Math.ceil(totalCount / pageSize), [totalCount, pageSize]);

    const toggleFilters = useCallback(() => {
      setShowFilters((prev) => !prev);
    }, []);

    const clearFilters = useCallback(() => {
      onMinLevelChange?.('');
      onAlertTypeChange?.('');
      onIncludeReadChange?.(true);
      onIncludeDismissedChange?.(false);
    }, [onMinLevelChange, onAlertTypeChange, onIncludeReadChange, onIncludeDismissedChange]);

    const getLevelName = useMemo(
      () =>
        (level: SecurityAlertLevel): string => {
          switch (level) {
            case SecurityAlertLevel.Critical:
              return 'Kritisch';
            case SecurityAlertLevel.High:
              return 'Hoch';
            case SecurityAlertLevel.Medium:
              return 'Mittel';
            case SecurityAlertLevel.Low:
              return 'Niedrig';
            case SecurityAlertLevel.Info:
              return 'Info';
            default:
              return 'Unbekannt';
          }
        },
      []
    );

    const getTypeName = useMemo(
      () =>
        (type: SecurityAlertType): string => {
          switch (type) {
            case SecurityAlertType.TokenTheftDetected:
              return 'Token-Diebstahl';
            case SecurityAlertType.ConcurrentSessionLimitExceeded:
              return 'Session-Limit überschritten';
            case SecurityAlertType.SessionHijackingDetected:
              return 'Session-Hijacking';
            case SecurityAlertType.UnusualLoginLocation:
              return 'Ungewöhnlicher Login-Standort';
            case SecurityAlertType.BruteForceAttack:
              return 'Brute-Force-Angriff';
            case SecurityAlertType.FailedLoginAttempts:
              return 'Fehlgeschlagene Logins';
            case SecurityAlertType.SuspiciousUserAgent:
              return 'Verdächtiger User Agent';
            case SecurityAlertType.UnauthorizedAccessAttempt:
              return 'Unberechtigter Zugriff';
            case SecurityAlertType.PrivilegeEscalationAttempt:
              return 'Privilege Escalation';
            case SecurityAlertType.SuspiciousRoleChange:
              return 'Verdächtige Rollenänderung';
            case SecurityAlertType.RateLimitExceeded:
              return 'Rate-Limit überschritten';
            case SecurityAlertType.AbnormalAPIUsage:
              return 'Abnormale API-Nutzung';
            case SecurityAlertType.DDoSPatternDetected:
              return 'DDoS-Muster';
            case SecurityAlertType.SuspiciousDataExport:
              return 'Verdächtiger Datenexport';
            case SecurityAlertType.MaliciousFileUpload:
              return 'Bösartiger Upload';
            case SecurityAlertType.SQLInjectionAttempt:
              return 'SQL-Injection';
            case SecurityAlertType.XSSAttempt:
              return 'XSS-Versuch';
            case SecurityAlertType.CSPViolation:
              return 'CSP-Verletzung';
            case SecurityAlertType.E2EEKeyExchangeFailure:
              return 'E2EE-Fehler';
            case SecurityAlertType.CertificateValidationFailed:
              return 'Zertifikatsfehler';
            case SecurityAlertType.IntegrityCheckFailed:
              return 'Integritätsfehler';
            default:
              return 'Unbekannt';
          }
        },
      []
    );

    const activeFiltersCount = useMemo(
      () =>
        [
          minLevel && minLevel !== '',
          alertType && alertType !== '',
          includeRead === false,
          includeDismissed === true,
        ].filter(Boolean).length,
      [minLevel, alertType, includeRead, includeDismissed]
    );

    return (
      <Box>
        {/* Header with Filter Toggle */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h6">Security Alerts ({totalCount.toLocaleString()})</Typography>
            {activeFiltersCount > 0 && (
              <Chip
                label={`${activeFiltersCount} Filter aktiv`}
                size="small"
                color="primary"
                onDelete={clearFilters}
              />
            )}
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant={showFilters ? 'contained' : 'outlined'}
              size="small"
              startIcon={<FilterIcon />}
              onClick={toggleFilters}
            >
              Filter
            </Button>
            {onRefresh ? (
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={onRefresh}
                disabled={isLoading}
              >
                Aktualisieren
              </Button>
            ) : null}
          </Box>
        </Box>

        {/* Filters */}
        {showFilters ? (
          <Box
            mb={3}
            p={2}
            bgcolor="background.paper"
            borderRadius={1}
            border={1}
            borderColor="divider"
          >
            <Typography variant="subtitle2" gutterBottom>
              Filter
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={2} mt={1}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Min. Schweregrad</InputLabel>
                <Select
                  value={minLevel ?? ''}
                  label="Min. Schweregrad"
                  onChange={(e) => onMinLevelChange?.(e.target.value)}
                >
                  <MenuItem value="">Alle</MenuItem>
                  <MenuItem value="Info">{getLevelName(SecurityAlertLevel.Info)}</MenuItem>
                  <MenuItem value="Low">{getLevelName(SecurityAlertLevel.Low)}</MenuItem>
                  <MenuItem value="Medium">{getLevelName(SecurityAlertLevel.Medium)}</MenuItem>
                  <MenuItem value="High">{getLevelName(SecurityAlertLevel.High)}</MenuItem>
                  <MenuItem value="Critical">{getLevelName(SecurityAlertLevel.Critical)}</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Alert-Typ</InputLabel>
                <Select
                  value={alertType ?? ''}
                  label="Alert-Typ"
                  onChange={(e) => onAlertTypeChange?.(e.target.value)}
                >
                  <MenuItem value="">Alle</MenuItem>
                  {Object.values(SecurityAlertType)
                    .filter((v) => typeof v === 'number')
                    .map((type) => (
                      <MenuItem key={type} value={SecurityAlertType[type as number]}>
                        {getTypeName(type as SecurityAlertType)}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={includeRead ?? true}
                    onChange={(e) => onIncludeReadChange?.(e.target.checked)}
                    size="small"
                  />
                }
                label="Gelesene anzeigen"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={includeDismissed ?? false}
                    onChange={(e) => onIncludeDismissedChange?.(e.target.checked)}
                    size="small"
                  />
                }
                label="Dismissed anzeigen"
              />
            </Box>
          </Box>
        ) : null}

        {/* Loading State */}
        {isLoading ? <LinearProgress sx={{ mb: 2 }} /> : null}

        {/* Error State */}
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        {/* Alert List */}
        {alerts.length === 0 && !isLoading && !error && (
          <Alert severity="info">Keine Security Alerts gefunden.</Alert>
        )}

        {alerts.length > 0 && (
          <>
            <Stack spacing={2} mb={3}>
              {alerts.map((alert) => (
                <SecurityAlertCard
                  key={alert.id}
                  alert={alert}
                  onDismiss={onDismiss}
                  onMarkRead={onMarkRead}
                  onViewDetails={onViewDetails}
                />
              ))}
            </Stack>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box display="flex" justifyContent="center">
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(_, page) => {
                    onPageChange(page);
                  }}
                  color="primary"
                  size="large"
                  showFirstButton
                  showLastButton
                />
              </Box>
            )}
          </>
        )}
      </Box>
    );
  }
);

SecurityAlertList.displayName = 'SecurityAlertList';

export default SecurityAlertList;
