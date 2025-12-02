import React from 'react';
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
  MoreVert as MoreIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { SecurityAlertResponse, SecurityAlertLevel, SecurityAlertType } from '../../types/models/SecurityAlert';

interface SecurityAlertCardProps {
  alert: SecurityAlertResponse;
  onDismiss?: (alertId: string, reason: string) => void;
  onMarkRead?: (alertId: string) => void;
  onViewDetails?: (alertId: string) => void;
}

const SecurityAlertCard: React.FC<SecurityAlertCardProps> = ({
  alert,
  onDismiss,
  onMarkRead,
  onViewDetails,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [expanded, setExpanded] = React.useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDismiss = () => {
    const reason = prompt('Grund für Dismiss:');
    if (reason && onDismiss) {
      onDismiss(alert.id, reason);
    }
    handleMenuClose();
  };

  const handleMarkRead = () => {
    if (onMarkRead) {
      onMarkRead(alert.id);
    }
    handleMenuClose();
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(alert.id);
    }
    handleMenuClose();
  };

  const getLevelColor = (level: SecurityAlertLevel): 'error' | 'warning' | 'info' | 'success' | 'default' => {
    switch (level) {
      case SecurityAlertLevel.Critical:
        return 'error';
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
  };

  const getLevelIcon = (level: SecurityAlertLevel) => {
    switch (level) {
      case SecurityAlertLevel.Critical:
      case SecurityAlertLevel.High:
        return <ErrorIcon />;
      case SecurityAlertLevel.Medium:
        return <WarningIcon />;
      case SecurityAlertLevel.Low:
        return <InfoIcon />;
      case SecurityAlertLevel.Info:
        return <CheckCircleIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getLevelName = (level: SecurityAlertLevel): string => {
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
  };

  const getTypeName = (type: SecurityAlertType): string => {
    switch (type) {
      case SecurityAlertType.TokenTheftDetected:
        return 'Token-Diebstahl erkannt';
      case SecurityAlertType.ConcurrentSessionLimitExceeded:
        return 'Session-Limit überschritten';
      case SecurityAlertType.SessionHijackingDetected:
        return 'Session-Hijacking erkannt';
      case SecurityAlertType.UnusualLoginLocation:
        return 'Ungewöhnlicher Login-Standort';
      case SecurityAlertType.BruteForceAttack:
        return 'Brute-Force-Angriff';
      case SecurityAlertType.FailedLoginAttempts:
        return 'Fehlgeschlagene Login-Versuche';
      case SecurityAlertType.SuspiciousUserAgent:
        return 'Verdächtiger User Agent';
      case SecurityAlertType.UnauthorizedAccessAttempt:
        return 'Unberechtigter Zugriffsversuch';
      case SecurityAlertType.PrivilegeEscalationAttempt:
        return 'Privilege-Escalation-Versuch';
      case SecurityAlertType.SuspiciousRoleChange:
        return 'Verdächtige Rollenänderung';
      case SecurityAlertType.RateLimitExceeded:
        return 'Rate-Limit überschritten';
      case SecurityAlertType.AbnormalAPIUsage:
        return 'Abnormale API-Nutzung';
      case SecurityAlertType.DDoSPatternDetected:
        return 'DDoS-Muster erkannt';
      case SecurityAlertType.SuspiciousDataExport:
        return 'Verdächtiger Datenexport';
      case SecurityAlertType.MaliciousFileUpload:
        return 'Bösartiger Datei-Upload';
      case SecurityAlertType.SQLInjectionAttempt:
        return 'SQL-Injection-Versuch';
      case SecurityAlertType.XSSAttempt:
        return 'XSS-Versuch';
      case SecurityAlertType.CSPViolation:
        return 'CSP-Verletzung';
      case SecurityAlertType.E2EEKeyExchangeFailure:
        return 'E2EE-Schlüsselaustausch fehlgeschlagen';
      case SecurityAlertType.CertificateValidationFailed:
        return 'Zertifikatsvalidierung fehlgeschlagen';
      case SecurityAlertType.IntegrityCheckFailed:
        return 'Integritätsprüfung fehlgeschlagen';
      default:
        return 'Unbekannter Typ';
    }
  };

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
                {!alert.isRead && (
                  <Chip label="Ungelesen" size="small" color="primary" />
                )}
                {alert.isDismissed && (
                  <Chip label="Dismissed" size="small" />
                )}
              </Box>

              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Chip
                  label={getLevelName(alert.level)}
                  color={getLevelColor(alert.level)}
                  size="small"
                />
                <Chip
                  label={getTypeName(alert.type)}
                  variant="outlined"
                  size="small"
                />
                {alert.occurrenceCount > 1 && (
                  <Chip
                    label={`${alert.occurrenceCount}x`}
                    color="warning"
                    size="small"
                  />
                )}
              </Box>

              <Typography variant="body2" color="text.secondary" mb={1}>
                {alert.message}
              </Typography>

              <Box display="flex" flexWrap="wrap" gap={2} mb={1}>
                {alert.userId && (
                  <Typography variant="caption" color="text.secondary">
                    User: {alert.userId}
                  </Typography>
                )}
                {alert.ipAddress && (
                  <Typography variant="caption" color="text.secondary">
                    IP: {alert.ipAddress}
                  </Typography>
                )}
                {alert.endpoint && (
                  <Typography variant="caption" color="text.secondary">
                    Endpoint: {alert.endpoint}
                  </Typography>
                )}
              </Box>

              <Typography variant="caption" color="text.secondary">
                {formatDistanceToNow(new Date(alert.createdAt), {
                  addSuffix: true,
                  locale: de,
                })}
                {alert.lastOccurrenceAt && alert.occurrenceCount > 1 && (
                  <>
                    {' • Zuletzt: '}
                    {formatDistanceToNow(new Date(alert.lastOccurrenceAt), {
                      addSuffix: true,
                      locale: de,
                    })}
                  </>
                )}
              </Typography>

              {Object.keys(alert.metadata).length > 0 && (
                <>
                  <Box mt={1}>
                    <IconButton
                      size="small"
                      onClick={() => setExpanded(!expanded)}
                    >
                      {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      <Typography variant="caption" sx={{ ml: 0.5 }}>
                        Metadata
                      </Typography>
                    </IconButton>
                  </Box>
                  <Collapse in={expanded}>
                    <Box
                      sx={{
                        mt: 1,
                        p: 1,
                        bgcolor: 'background.default',
                        borderRadius: 1,
                      }}
                    >
                      <pre style={{ margin: 0, fontSize: '0.75rem' }}>
                        {JSON.stringify(alert.metadata, null, 2)}
                      </pre>
                    </Box>
                  </Collapse>
                </>
              )}
            </Box>
          </Box>

          <Box>
            <Tooltip title="Aktionen">
              <IconButton size="small" onClick={handleMenuOpen}>
                <MoreIcon />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              {!alert.isRead && onMarkRead && (
                <MenuItem onClick={handleMarkRead}>Als gelesen markieren</MenuItem>
              )}
              {onViewDetails && (
                <MenuItem onClick={handleViewDetails}>Details anzeigen</MenuItem>
              )}
              {!alert.isDismissed && onDismiss && (
                <MenuItem onClick={handleDismiss}>Dismiss</MenuItem>
              )}
            </Menu>
          </Box>
        </Box>

        {alert.isDismissed && alert.dismissalReason && (
          <Box
            mt={2}
            p={1}
            bgcolor="action.hover"
            borderRadius={1}
          >
            <Typography variant="caption" color="text.secondary">
              <strong>Dismiss-Grund:</strong> {alert.dismissalReason}
            </Typography>
            {alert.dismissedAt && (
              <Typography variant="caption" color="text.secondary" display="block">
                {formatDistanceToNow(new Date(alert.dismissedAt), {
                  addSuffix: true,
                  locale: de,
                })}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SecurityAlertCard;
