import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Verified as VerifiedIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import PhoneVerificationDialog from './PhoneVerificationDialog';
import { useAppDispatch } from '../../store/store.hooks';
import authService from '../../api/services/authService';
import { getProfile } from '../../features/auth/authSlice';
import { useLoading } from '../../contexts/LoadingContext';

interface PhoneVerificationSectionProps {
  currentPhone?: string | null;
  isVerified?: boolean;
  onVerificationComplete?: (phoneNumber: string) => void;
}

/**
 * Phone Verification Section Component
 * Manages phone number addition, verification, and removal
 */
const PhoneVerificationSection: React.FC<PhoneVerificationSectionProps> = ({
  currentPhone,
  isVerified = false,
  onVerificationComplete,
}) => {
  const dispatch = useAppDispatch();
  const { withLoading, isLoading } = useLoading();
  const [showDialog, setShowDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Format phone number for display (mask middle digits)
  const formatPhoneDisplay = (phone: string) => {
    if (!phone || phone.length < 10) return phone;
    const visibleStart = phone.slice(0, 4);
    const visibleEnd = phone.slice(-2);
    const maskedMiddle = '****';
    return `${visibleStart}${maskedMiddle}${visibleEnd}`;
  };

  // Handle phone verification success
  const handleVerificationSuccess = async (phoneNumber: string) => {
    setShowDialog(false);
    setSuccessMessage('Telefonnummer erfolgreich verifiziert!');
    setEditMode(false);
    
    // Refresh user profile
    await dispatch(getProfile());
    
    if (onVerificationComplete) {
      onVerificationComplete(phoneNumber);
    }
    
    // Clear success message after 5 seconds
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  // Handle phone removal
  const handleRemovePhone = async () => {
    if (!window.confirm('Möchten Sie Ihre Telefonnummer wirklich entfernen?')) {
      return;
    }

    await withLoading('removePhone', async () => {
      try {
        setError(null);
        await authService.removePhoneNumber();
        await dispatch(getProfile());
        setSuccessMessage('Telefonnummer erfolgreich entfernt.');
        setTimeout(() => setSuccessMessage(null), 5000);
      } catch (err: any) {
        console.error('Failed to remove phone number:', err);
        setError(err?.message || 'Fehler beim Entfernen der Telefonnummer.');
      }
    });
  };

  // Handle opening dialog for editing
  const handleEditPhone = () => {
    setEditMode(true);
    setShowDialog(true);
  };

  // Handle opening dialog for adding
  const handleAddPhone = () => {
    setEditMode(false);
    setShowDialog(true);
  };

  return (
    <>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PhoneIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">Telefonnummer-Verifizierung</Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Fügen Sie eine Telefonnummer hinzu, um zusätzliche Sicherheit für Ihr Konto zu gewährleisten
            und wichtige SMS-Benachrichtigungen zu erhalten.
          </Typography>

          {/* Error Alert */}
          {error && (
            <Alert 
              severity="error" 
              onClose={() => setError(null)}
              sx={{ mb: 2 }}
            >
              {error}
            </Alert>
          )}

          {/* Success Alert */}
          {successMessage && (
            <Alert 
              severity="success" 
              onClose={() => setSuccessMessage(null)}
              sx={{ mb: 2 }}
            >
              {successMessage}
            </Alert>
          )}

          {currentPhone ? (
            <Box>
              {/* Phone number display */}
              <Box 
                sx={{ 
                  p: 2, 
                  bgcolor: 'background.default', 
                  borderRadius: 1,
                  border: 1,
                  borderColor: isVerified ? 'success.main' : 'warning.main',
                  mb: 2
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace', mb: 1 }}>
                      {formatPhoneDisplay(currentPhone)}
                    </Typography>
                    <Chip
                      icon={isVerified ? <VerifiedIcon /> : <SecurityIcon />}
                      label={isVerified ? 'Verifiziert' : 'Nicht verifiziert'}
                      color={isVerified ? 'success' : 'warning'}
                      size="small"
                    />
                  </Box>
                  
                  <Stack direction="row" spacing={1}>
                    {!isVerified && (
                      <Tooltip title="Telefonnummer verifizieren">
                        <IconButton
                          color="primary"
                          onClick={() => setShowDialog(true)}
                          disabled={isLoading('removePhone')}
                        >
                          <VerifiedIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Telefonnummer ändern">
                      <IconButton
                        color="primary"
                        onClick={handleEditPhone}
                        disabled={isLoading('removePhone')}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Telefonnummer entfernen">
                      <IconButton
                        color="error"
                        onClick={handleRemovePhone}
                        disabled={isLoading('removePhone')}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </Box>

              {/* Action buttons based on verification status */}
              {!isVerified && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setShowDialog(true)}
                  startIcon={<VerifiedIcon />}
                  fullWidth
                >
                  Telefonnummer verifizieren
                </Button>
              )}
            </Box>
          ) : (
            <Box>
              {/* No phone number state */}
              <Box 
                sx={{ 
                  p: 3, 
                  bgcolor: 'background.default', 
                  borderRadius: 1,
                  border: 1,
                  borderColor: 'divider',
                  borderStyle: 'dashed',
                  textAlign: 'center',
                  mb: 2
                }}
              >
                <PhoneIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Keine Telefonnummer hinterlegt
                </Typography>
              </Box>

              <Button
                variant="contained"
                color="primary"
                onClick={handleAddPhone}
                startIcon={<AddIcon />}
                fullWidth
              >
                Telefonnummer hinzufügen
              </Button>
            </Box>
          )}

          {/* Benefits list */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
              Vorteile der Telefonnummer-Verifizierung:
            </Typography>
            <Stack spacing={0.5}>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                • Zusätzliche Kontowiederherstellungsoption
              </Typography>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                • SMS-Benachrichtigungen für wichtige Termine
              </Typography>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                • Zwei-Faktor-Authentifizierung per SMS
              </Typography>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                • Erhöhte Kontosicherheit
              </Typography>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {/* Phone Verification Dialog */}
      <PhoneVerificationDialog
        open={showDialog}
        onClose={() => {
          setShowDialog(false);
          setEditMode(false);
        }}
        onVerificationComplete={handleVerificationSuccess}
        existingPhone={editMode ? currentPhone : undefined}
        isEditMode={editMode}
      />
    </>
  );
};

export default PhoneVerificationSection;