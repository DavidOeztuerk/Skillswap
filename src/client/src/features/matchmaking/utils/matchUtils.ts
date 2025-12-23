import type { Theme } from '@mui/material';

export const getMatchStatusColor = (status: string, theme: Theme): string => {
  const normalizedStatus = status.toLowerCase();
  switch (normalizedStatus) {
    case 'pending':
      return theme.palette.warning.main;
    case 'accepted':
      return theme.palette.success.main;
    case 'rejected':
      return theme.palette.error.main;
    case 'expired':
      return theme.palette.grey[500];
    case 'completed':
      return theme.palette.info.main;
    case 'cancelled':
      return theme.palette.error.main;
    case 'active':
      return theme.palette.success.main;
    case 'dissolved':
      return theme.palette.grey[600];
    default:
      return theme.palette.grey[500];
  }
};

export const getMatchStatusLabel = (status: string): string => {
  const normalizedStatus = status.toLowerCase();
  switch (normalizedStatus) {
    case 'pending':
      return 'Ausstehend';
    case 'accepted':
      return 'Akzeptiert';
    case 'rejected':
      return 'Abgelehnt';
    case 'expired':
      return 'Abgelaufen';
    case 'completed':
      return 'Abgeschlossen';
    case 'cancelled':
      return 'Abgebrochen';
    case 'active':
      return 'Aktiv';
    case 'dissolved':
      return 'Aufgelöst';
    default:
      return status;
  }
};

export const getMatchStatusMessage = (status: string): string => {
  const s = status.toLowerCase();
  if (s === 'rejected') return 'Match wurde abgelehnt';
  if (s === 'expired') return 'Match ist abgelaufen';
  if (s === 'completed') return 'Match ist abgeschlossen';
  if (s === 'cancelled' || s === 'canceled') return 'Match wurde abgebrochen';
  return 'Warte auf Antwort...';
};
