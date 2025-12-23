import React, { memo, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  MoreVert as MoreIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Collapse,
} from '@mui/material';
import {
  type SecurityAlertResponse,
  SecurityAlertLevel,
  SecurityAlertType,
} from '../../notifications/types/SecurityAlert';

// ============================================================================
// Helper functions (extracted to reduce component complexity)
// ============================================================================
type ChipColor = 'error' | 'warning' | 'info' | 'success' | 'default';

function getLevelColor(level: SecurityAlertLevel): ChipColor {
  switch (level) {
    case SecurityAlertLevel.Critical:
    case SecurityAlertLevel.High:
      return 'error';
    case SecurityAlertLevel.Medium:
      return 'warning';
    case SecurityAlertLevel.Low:
      return 'info';
    case SecurityAlertLevel.Info:
      return 'success';
    default:
      return 'default';
  }
}

function getLevelName(level: SecurityAlertLevel): string {
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
}

function getTypeName(type: SecurityAlertType): string {
  const typeNames: Record<SecurityAlertType, string> = {
    [SecurityAlertType.TokenTheftDetected]: 'Token-Diebstahl erkannt',
    [SecurityAlertType.ConcurrentSessionLimitExceeded]: 'Session-Limit überschritten',
    [SecurityAlertType.SessionHijackingDetected]: 'Session-Hijacking erkannt',
    [SecurityAlertType.UnusualLoginLocation]: 'Ungewöhnlicher Login-Standort',
    [SecurityAlertType.BruteForceAttack]: 'Brute-Force-Angriff',
    [SecurityAlertType.FailedLoginAttempts]: 'Fehlgeschlagene Login-Versuche',
    [SecurityAlertType.SuspiciousUserAgent]: 'Verdächtiger User Agent',
    [SecurityAlertType.UnauthorizedAccessAttempt]: 'Unberechtigter Zugriffsversuch',
    [SecurityAlertType.PrivilegeEscalationAttempt]: 'Privilege-Escalation-Versuch',
    [SecurityAlertType.SuspiciousRoleChange]: 'Verdächtige Rollenänderung',
    [SecurityAlertType.RateLimitExceeded]: 'Rate-Limit überschritten',
    [SecurityAlertType.AbnormalAPIUsage]: 'Abnormale API-Nutzung',
    [SecurityAlertType.DDoSPatternDetected]: 'DDoS-Muster erkannt',
    [SecurityAlertType.SuspiciousDataExport]: 'Verdächtiger Datenexport',
    [SecurityAlertType.MaliciousFileUpload]: 'Bösartiger Datei-Upload',
    [SecurityAlertType.SQLInjectionAttempt]: 'SQL-Injection-Versuch',
    [SecurityAlertType.XSSAttempt]: 'XSS-Versuch',
    [SecurityAlertType.CSPViolation]: 'CSP-Verletzung',
    [SecurityAlertType.E2EEKeyExchangeFailure]: 'E2EE-Schlüsselaustausch fehlgeschlagen',
    [SecurityAlertType.CertificateValidationFailed]: 'Zertifikatsvalidierung fehlgeschlagen',
    [SecurityAlertType.IntegrityCheckFailed]: 'Integritätsprüfung fehlgeschlagen',
  };
  return typeNames[type];
}

// Pre-rendered icon elements for each level to avoid creating new elements during render
const LEVEL_ICONS: Record<SecurityAlertLevel, React.ReactElement> = {
  [SecurityAlertLevel.Critical]: <ErrorIcon />,
  [SecurityAlertLevel.High]: <ErrorIcon />,
  [SecurityAlertLevel.Medium]: <WarningIcon />,
  [SecurityAlertLevel.Low]: <InfoIcon />,
  [SecurityAlertLevel.Info]: <CheckCircleIcon />,
};

function getLevelIcon(level: SecurityAlertLevel): React.ReactElement {
  return LEVEL_ICONS[level];
}

// ============================================================================
// Sub-components (extracted to reduce cognitive complexity)
// ============================================================================
interface AlertDetailsProps {
  userId?: string;
  ipAddress?: string;
  endpoint?: string;
}

const AlertDetails: React.FC<AlertDetailsProps> = memo(({ userId, ipAddress, endpoint }) => {
  if (!userId && !ipAddress && !endpoint) return null;

  return (
    <Box display="flex" flexWrap="wrap" gap={2} mb={1}>
      {userId ? (
        <Typography variant="caption" color="text.secondary">
          User: {userId}
        </Typography>
      ) : null}
      {ipAddress ? (
        <Typography variant="caption" color="text.secondary">
          IP: {ipAddress}
        </Typography>
      ) : null}
      {endpoint ? (
        <Typography variant="caption" color="text.secondary">
          Endpoint: {endpoint}
        </Typography>
      ) : null}
    </Box>
  );
});
AlertDetails.displayName = 'AlertDetails';

interface AlertMetadataProps {
  metadata: Record<string, unknown>;
  expanded: boolean;
  onToggle: () => void;
}

const AlertMetadata: React.FC<AlertMetadataProps> = memo(({ metadata, expanded, onToggle }) => {
  if (Object.keys(metadata).length === 0) return null;

  return (
    <>
      <Box mt={1}>
        <IconButton size="small" onClick={onToggle}>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          <Typography variant="caption" sx={{ ml: 0.5 }}>
            Metadata
          </Typography>
        </IconButton>
      </Box>
      <Collapse in={expanded}>
        <Box sx={{ mt: 1, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
          <pre style={{ margin: 0, fontSize: '0.75rem' }}>{JSON.stringify(metadata, null, 2)}</pre>
        </Box>
      </Collapse>
    </>
  );
});
AlertMetadata.displayName = 'AlertMetadata';

interface AlertDismissInfoProps {
  isDismissed: boolean;
  dismissalReason?: string;
  dismissedAt?: string;
}

const AlertDismissInfo: React.FC<AlertDismissInfoProps> = memo(
  ({ isDismissed, dismissalReason, dismissedAt }) => {
    if (!isDismissed || !dismissalReason) return null;

    return (
      <Box mt={2} p={1} bgcolor="action.hover" borderRadius={1}>
        <Typography variant="caption" color="text.secondary">
          <strong>Dismiss-Grund:</strong> {dismissalReason}
        </Typography>
        {dismissedAt ? (
          <Typography variant="caption" color="text.secondary" display="block">
            {formatDistanceToNow(new Date(dismissedAt), { addSuffix: true, locale: de })}
          </Typography>
        ) : null}
      </Box>
    );
  }
);
AlertDismissInfo.displayName = 'AlertDismissInfo';

// ============================================================================
// Main Component Types
// ============================================================================
interface SecurityAlertCardProps {
  alert: SecurityAlertResponse;
  onDismiss?: (alertId: string, reason: string) => void;
  onMarkRead?: (alertId: string) => void;
  onViewDetails?: (alertId: string) => void;
}

const SecurityAlertCard: React.FC<SecurityAlertCardProps> = memo(
  ({ alert, onDismiss, onMarkRead, onViewDetails }) => {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [expanded, setExpanded] = React.useState(false);

    const handleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);
    }, []);

    const handleMenuClose = useCallback(() => {
      setAnchorEl(null);
    }, []);

    const handleDismiss = useCallback(() => {
      // eslint-disable-next-line no-alert -- Admin panel: prompt is intentional for quick dismiss reason input
      const reason = prompt('Grund für Dismiss:');
      if (reason && onDismiss) {
        onDismiss(alert.id, reason);
      }
      setAnchorEl(null);
    }, [alert.id, onDismiss]);

    const handleMarkRead = useCallback(() => {
      onMarkRead?.(alert.id);
      setAnchorEl(null);
    }, [alert.id, onMarkRead]);

    const handleViewDetails = useCallback(() => {
      onViewDetails?.(alert.id);
      setAnchorEl(null);
    }, [alert.id, onViewDetails]);

    const toggleExpanded = useCallback(() => {
      setExpanded((prev) => !prev);
    }, []);

    return (
      <Card
        sx={{
          borderLeft: 4,
          borderColor: `${getLevelColor(alert.level)}.main`,
          opacity: alert.isDismissed ? 0.6 : 1,
          backgroundColor: alert.isRead ? 'background.paper' : 'action.hover',
        }}
      >
        <CardContent>
          <Box display="flex" alignItems="flex-start" justifyContent="space-between">
            <Box display="flex" alignItems="flex-start" gap={2} flex={1}>
              <Box color={`${getLevelColor(alert.level)}.main`} sx={{ mt: 0.5 }}>
                {getLevelIcon(alert.level)}
              </Box>
              <Box flex={1}>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <Typography variant="h6" component="h3">
                    {alert.title}
                  </Typography>
                  {!alert.isRead && <Chip label="Ungelesen" size="small" color="primary" />}
                  {alert.isDismissed ? <Chip label="Dismissed" size="small" /> : null}
                </Box>

                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Chip
                    label={getLevelName(alert.level)}
                    color={getLevelColor(alert.level)}
                    size="small"
                  />
                  <Chip label={getTypeName(alert.type)} variant="outlined" size="small" />
                  {alert.occurrenceCount > 1 && (
                    <Chip label={`${alert.occurrenceCount}x`} color="warning" size="small" />
                  )}
                </Box>

                <Typography variant="body2" color="text.secondary" mb={1}>
                  {alert.message}
                </Typography>

                <AlertDetails
                  userId={alert.userId}
                  ipAddress={alert.ipAddress}
                  endpoint={alert.endpoint}
                />

                <Typography variant="caption" color="text.secondary">
                  {formatDistanceToNow(new Date(alert.createdAt), {
                    addSuffix: true,
                    locale: de,
                  })}
                  {alert.lastOccurrenceAt && alert.occurrenceCount > 1 ? (
                    <>
                      {' • Zuletzt: '}
                      {formatDistanceToNow(new Date(alert.lastOccurrenceAt), {
                        addSuffix: true,
                        locale: de,
                      })}
                    </>
                  ) : null}
                </Typography>

                <AlertMetadata
                  metadata={alert.metadata}
                  expanded={expanded}
                  onToggle={toggleExpanded}
                />
              </Box>
            </Box>

            <Box>
              <Tooltip title="Aktionen">
                <IconButton size="small" onClick={handleMenuOpen}>
                  <MoreIcon />
                </IconButton>
              </Tooltip>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                {!alert.isRead && onMarkRead ? (
                  <MenuItem onClick={handleMarkRead}>Als gelesen markieren</MenuItem>
                ) : null}
                {onViewDetails ? (
                  <MenuItem onClick={handleViewDetails}>Details anzeigen</MenuItem>
                ) : null}
                {!alert.isDismissed && onDismiss ? (
                  <MenuItem onClick={handleDismiss}>Dismiss</MenuItem>
                ) : null}
              </Menu>
            </Box>
          </Box>

          <AlertDismissInfo
            isDismissed={alert.isDismissed}
            dismissalReason={alert.dismissalReason}
            dismissedAt={alert.dismissedAt}
          />
        </CardContent>
      </Card>
    );
  }
);

SecurityAlertCard.displayName = 'SecurityAlertCard';

export default SecurityAlertCard;
