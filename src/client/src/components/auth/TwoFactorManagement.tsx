import React, { useState, useCallback, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import authService from '../../api/services/authService';
import { useTwoFactorDialog } from './TwoFactorDialog';


const TwoFactorManagement: React.FC = React.memo(() => {
  // Use the global dialog context
  const { showDialog, setHasSecret } = useTwoFactorDialog();
  
  // Component mount tracking
  useEffect(() => {
    console.log('🏁 TwoFactorManagement MOUNTED');
    return () => {
      console.log('💀 TwoFactorManagement UNMOUNTED');
    };
  }, []);
  
  // Don't subscribe to globalLoading changes to avoid re-renders
  const globalLoading = false; // Temporarily disable to prevent re-renders
  
  // Local state for 2FA status
  const [status, setStatus] = useState<{
    loading: boolean;
    enabled: boolean;
    hasSecret: boolean;
    error: string | null;
  }>({
    loading: true,
    enabled: false,
    hasSecret: false,
    error: null
  });
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [disableError, setDisableError] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  
  // Load 2FA status on mount
  useEffect(() => {
    let mounted = true;
    
    const loadStatus = async () => {
      try {
        console.log('📱 Loading 2FA status...');
        const result = await authService.getTwoFactorStatus();
        console.log('📊 Full 2FA status response:', result);
        if (mounted) {
          setStatus({
            loading: false,
            enabled: result?.isEnabled || false,
            hasSecret: result?.hasSecret || false,
            error: null
          });
          // Update dialog context with hasSecret status
          setHasSecret(result?.hasSecret || false);
          console.log('✅ 2FA status loaded - isEnabled:', result?.isEnabled, 'hasSecret:', result?.hasSecret);
        }
      } catch (err) {
        console.error('❌ Failed to load 2FA status:', err);
        if (mounted) {
          setStatus({
            loading: false,
            enabled: false,
            hasSecret: false,
            error: 'Failed to load 2FA status'
          });
        }
      }
    };
    
    loadStatus();
    
    return () => {
      mounted = false;
    };
  }, []); // Only on mount

  const handleEnableClick = useCallback(() => {
    console.log('✅ handleEnableClick called, opening setup dialog');
    showDialog(); // Use the global dialog
  }, [showDialog]);


  const handleDisableClick = useCallback(() => {
    setShowDisableDialog(true);
    setPassword('');
    setDisableError('');
  }, []);

  const handleDisableConfirm = useCallback(async () => {
    if (!password) {
      setDisableError('Password is required');
      return;
    }

    setLocalLoading(true);
    try {
      await authService.disableTwoFactor({ password });
      // Reload status after successful disable
      const result = await authService.getTwoFactorStatus();
      setStatus({
        loading: false,
        enabled: result?.isEnabled || false,
        hasSecret: result?.hasSecret || false,
        error: null
      });
      setShowDisableDialog(false);
      setPassword('');
    } catch (err: any) {
      setDisableError(err.message || 'Failed to disable 2FA. Please check your password.');
    } finally {
      setLocalLoading(false);
    }
  }, [password]);

  const handleSwitchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    // Prevent default behavior and stop propagation
    event.preventDefault();
    event.stopPropagation();
    
    // If trying to enable (toggle is currently off)
    if (!status.enabled) {
      console.log('🔄 Opening 2FA setup dialog...');
      handleEnableClick();
    } else {
      // If trying to disable (toggle is currently on)
      console.log('🔄 Opening disable 2FA dialog...');
      handleDisableClick();
    }
  }, [status.enabled, handleEnableClick, handleDisableClick]);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setDisableError('');
  }, []);

  const handleCloseDisableDialog = useCallback(() => {
    setShowDisableDialog(false);
    setPassword('');
    setDisableError('');
  }, []);

  // Show loading state
  if (status.loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (status.error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            {status.error}
            <Button onClick={() => window.location.reload()} sx={{ ml: 2 }}>
              Retry
            </Button>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" mb={3}>
            <SecurityIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
            <Box flex={1}>
              <Typography variant="h5" gutterBottom>
                Two-Factor Authentication
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Add an extra layer of security to your account
              </Typography>
            </Box>
            <Chip
              icon={status.enabled ? <CheckCircleIcon /> : <CancelIcon />}
              label={status.enabled ? 'Enabled' : 'Disabled'}
              color={status.enabled ? 'success' : 'default'}
              variant={status.enabled ? 'filled' : 'outlined'}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box my={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={status.enabled}
                  onChange={handleSwitchChange}
                  color="primary"
                  disabled={localLoading || globalLoading}
                />
              }
              label={
                <Box>
                  <Typography variant="body1">
                    Enable Two-Factor Authentication
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Require a verification code in addition to your password
                  </Typography>
                </Box>
              }
              labelPlacement="start"
              sx={{ ml: 0, width: '100%', justifyContent: 'space-between' }}
            />
          </Box>

          {status.enabled ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              Your account is protected with two-factor authentication. You'll need your authenticator app to sign in.
            </Alert>
          ) : status.hasSecret && !status.enabled ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <strong>Setup incomplete!</strong> You have generated a 2FA secret but haven't verified it yet. 
              Click the toggle again to complete the setup by scanning the QR code and entering the verification code.
            </Alert>
          ) : (
            <Alert severity="info" sx={{ mb: 2 }}>
              Two-factor authentication is not enabled. We recommend enabling it for better account security.
            </Alert>
          )}

          <Box mt={3}>
            <Typography variant="h6" gutterBottom>
              How it works
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              When two-factor authentication is enabled, you'll be prompted for a verification code 
              from your authenticator app whenever you sign in. This ensures that only you can 
              access your account, even if someone else knows your password.
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Supported apps: Google Authenticator, Microsoft Authenticator, Authy, and other TOTP-compatible apps.
            </Typography>
          </Box>

          {status.enabled && (
            <Box mt={3}>
              <Button
                variant="outlined"
                color="error"
                onClick={handleDisableClick}
                disabled={localLoading || globalLoading}
              >
                Disable Two-Factor Authentication
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialog is now handled globally by TwoFactorDialogProvider */}

      {/* Disable Dialog */}
      <Dialog 
        open={showDisableDialog} 
        onClose={handleCloseDisableDialog} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Disabling two-factor authentication will make your account less secure. 
            You'll only need your password to sign in.
          </Alert>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please enter your password to confirm:
          </Typography>
          <TextField
            fullWidth
            type="password"
            label="Password"
            value={password}
            onChange={handlePasswordChange}
            error={!!disableError}
            helperText={disableError}
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDisableDialog}>Cancel</Button>
          <Button
            onClick={handleDisableConfirm}
            color="error"
            variant="contained"
            disabled={!password || localLoading}
          >
            {localLoading ? <CircularProgress size={24} /> : 'Disable 2FA'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});

TwoFactorManagement.displayName = 'TwoFactorManagement';

export default TwoFactorManagement;