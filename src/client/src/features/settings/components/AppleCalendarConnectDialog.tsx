import React, { useState } from 'react';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Apple as AppleIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  Stack,
  CircularProgress,
  InputAdornment,
  IconButton,
  Box,
} from '@mui/material';

interface AppleCalendarConnectDialogProps {
  open: boolean;
  onClose: () => void;
  onConnect: (appleId: string, appPassword: string) => Promise<boolean>;
  isConnecting: boolean;
}

/**
 * Dialog for connecting Apple Calendar using App-specific password
 * Apple Calendar uses CalDAV protocol which requires App-specific password
 * instead of OAuth for third-party apps
 */
const AppleCalendarConnectDialog: React.FC<AppleCalendarConnectDialogProps> = ({
  open,
  onClose,
  onConnect,
  isConnecting,
}) => {
  const [appleId, setAppleId] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (): Promise<void> => {
    // Validate inputs
    if (!appleId.trim()) {
      setError('Bitte gib deine Apple ID ein');
      return;
    }

    if (!appleId.includes('@')) {
      setError('Bitte gib eine gültige E-Mail-Adresse ein');
      return;
    }

    if (!appPassword.trim()) {
      setError('Bitte gib dein App-spezifisches Passwort ein');
      return;
    }

    // App-specific passwords are typically in format: xxxx-xxxx-xxxx-xxxx
    const cleanPassword = appPassword.replaceAll(/\s/g, '');
    if (cleanPassword.length < 16) {
      setError('App-spezifisches Passwort muss mindestens 16 Zeichen haben');
      return;
    }

    setError(null);

    const success = await onConnect(appleId.trim(), cleanPassword);

    if (success) {
      // Reset form and close dialog
      setAppleId('');
      setAppPassword('');
      onClose();
    }
  };

  const handleClose = (): void => {
    if (!isConnecting) {
      setAppleId('');
      setAppPassword('');
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={isConnecting}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <AppleIcon />
          <Typography variant="h6">Apple iCloud Kalender verbinden</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3, mt: 1 }}>
          <Typography variant="body2">
            Apple erfordert ein <strong>App-spezifisches Passwort</strong> für die
            Kalender-Synchronisation. Dein normales Apple-Passwort funktioniert nicht.
          </Typography>
        </Alert>

        {error ? (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            onClose={() => {
              setError(null);
            }}
          >
            {error}
          </Alert>
        ) : null}

        <Stack spacing={3}>
          <TextField
            label="Apple ID (E-Mail)"
            type="email"
            value={appleId}
            onChange={(e) => {
              setAppleId(e.target.value);
            }}
            fullWidth
            required
            disabled={isConnecting}
            placeholder="max@icloud.com"
            autoComplete="email"
            helperText="Die E-Mail-Adresse, mit der du dich bei Apple anmeldest"
          />

          <TextField
            label="App-spezifisches Passwort"
            type={showPassword ? 'text' : 'password'}
            value={appPassword}
            onChange={(e) => {
              setAppPassword(e.target.value);
            }}
            fullWidth
            required
            disabled={isConnecting}
            placeholder="xxxx-xxxx-xxxx-xxxx"
            autoComplete="off"
            helperText="Das 16-stellige Passwort aus deinen Apple-Einstellungen"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="Passwort anzeigen"
                      onClick={() => {
                        setShowPassword(!showPassword);
                      }}
                      edge="end"
                      disabled={isConnecting}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Box
            sx={{
              p: 2,
              bgcolor: 'action.hover',
              borderRadius: 1,
              border: 1,
              borderColor: 'divider',
            }}
          >
            <Typography variant="subtitle2" gutterBottom>
              So erstellst du ein App-spezifisches Passwort:
            </Typography>
            <Typography variant="body2" component="ol" sx={{ pl: 2, m: 0 }}>
              <li>
                Gehe zu{' '}
                <Link href="https://appleid.apple.com" target="_blank" rel="noopener noreferrer">
                  appleid.apple.com
                </Link>
              </li>
              <li>Melde dich mit deiner Apple ID an</li>
              <li>
                Gehe zu &quot;Anmeldung und Sicherheit&quot; → &quot;App-spezifische
                Passwörter&quot;
              </li>
              <li>Klicke auf &quot;App-spezifisches Passwort erstellen&quot;</li>
              <li>Gib einen Namen ein (z.B. &quot;SkillSwap&quot;) und kopiere das Passwort</li>
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={isConnecting}>
          Abbrechen
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            void handleConnect();
          }}
          disabled={isConnecting || !appleId.trim() || !appPassword.trim()}
          startIcon={isConnecting ? <CircularProgress size={20} color="inherit" /> : <AppleIcon />}
        >
          {isConnecting ? 'Verbinde...' : 'Verbinden'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AppleCalendarConnectDialog;
