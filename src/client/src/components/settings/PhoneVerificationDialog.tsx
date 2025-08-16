import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  InputAdornment,
  CircularProgress,
  MenuItem,
} from '@mui/material';
import {
  Close as CloseIcon,
  Phone as PhoneIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import LoadingButton from '../ui/LoadingButton';
import { useLoading } from '../../contexts/LoadingContext';
import authService from '../../api/services/authService';

// Country codes for phone number input
const countryCodes = [
  { code: '+49', country: 'Deutschland', flag: '🇩🇪' },
  { code: '+43', country: 'Österreich', flag: '🇦🇹' },
  { code: '+41', country: 'Schweiz', flag: '🇨🇭' },
  { code: '+1', country: 'USA', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+33', country: 'Frankreich', flag: '🇫🇷' },
  { code: '+39', country: 'Italien', flag: '🇮🇹' },
  { code: '+34', country: 'Spanien', flag: '🇪🇸' },
  { code: '+31', country: 'Niederlande', flag: '🇳🇱' },
];

// Phone number validation schema
const phoneSchema = z.object({
  countryCode: z.string().min(1, 'Ländercode ist erforderlich'),
  phoneNumber: z
    .string()
    .min(1, 'Telefonnummer ist erforderlich')
    .regex(/^[0-9]{7,15}$/, 'Ungültige Telefonnummer (7-15 Ziffern)'),
});

// Verification code validation schema
const codeSchema = z.object({
  code: z
    .string()
    .min(6, 'Der Verifizierungscode muss 6 Zeichen lang sein')
    .max(6, 'Der Verifizierungscode muss 6 Zeichen lang sein')
    .regex(/^\d{6}$/, 'Der Code muss aus 6 Ziffern bestehen'),
});

type PhoneFormValues = z.infer<typeof phoneSchema>;
type CodeFormValues = z.infer<typeof codeSchema>;

interface PhoneVerificationDialogProps {
  open: boolean;
  onClose: () => void;
  onVerificationComplete?: (phoneNumber: string) => void;
  existingPhone?: string | null;
  isEditMode?: boolean;
}

/**
 * Phone Verification Dialog Component
 * Multi-step dialog for phone number verification
 */
const PhoneVerificationDialog: React.FC<PhoneVerificationDialogProps> = ({
  open,
  onClose,
  onVerificationComplete,
  isEditMode = false,
}) => {
  const { withLoading, isLoading } = useLoading();
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fullPhoneNumber, setFullPhoneNumber] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Phone number form
  const phoneForm = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      countryCode: '+49',
      phoneNumber: '',
    },
  });

  // Verification code form
  const codeForm = useForm<CodeFormValues>({
    resolver: zodResolver(codeSchema),
    defaultValues: {
      code: '',
    },
  });

  const codeValue = codeForm.watch('code');

  // Reset forms when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setActiveStep(0);
      setError(null);
      phoneForm.reset();
      codeForm.reset();
      setResendCooldown(0);
    }
  }, [open]);

  // Cooldown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Steps for the stepper
  const steps = ['Telefonnummer eingeben', 'Code verifizieren', 'Fertig'];

  // Handle phone number submission
  const handlePhoneSubmit = async (data: PhoneFormValues) => {
    await withLoading('sendPhoneVerification', async () => {
      try {
        setError(null);
        const fullNumber = `${data.countryCode}${data.phoneNumber}`;
        setFullPhoneNumber(fullNumber);
        
        // Send verification code
        const response = await authService.sendPhoneVerificationCode(fullNumber);
        
        if (!response.success) {
          setError(response.message || 'Fehler beim Senden des Verifizierungscodes.');
          return;
        }
        
        // Check for cooldown
        if (response.data?.cooldownUntil) {
          const cooldownDate = new Date(response.data.cooldownUntil);
          const now = new Date();
          const cooldownSeconds = Math.max(0, Math.ceil((cooldownDate.getTime() - now.getTime()) / 1000));
          setResendCooldown(cooldownSeconds);
        } else {
          setResendCooldown(60); // Default 60 second cooldown
        }
        
        // Only proceed if the code was actually sent
        if (response.data?.success) {
          setActiveStep(1);
        } else {
          setError(response.data?.message || 'Code konnte nicht gesendet werden.');
        }
      } catch (err: any) {
        console.error('Failed to send verification code:', err);
        setError(
          err?.response?.data?.message || 
          err?.message || 
          'Fehler beim Senden des Verifizierungscodes.'
        );
      }
    });
  };

  // Handle code verification
  const handleCodeSubmit = async (data: CodeFormValues) => {
    await withLoading('verifyPhoneCode', async () => {
      try {
        setError(null);
        
        // Verify the code
        const response = await authService.verifyPhoneCode(data.code);
        
        if (!response.success) {
          setError(response.message || 'Verifizierung fehlgeschlagen.');
          return;
        }
        
        if (response.data?.phoneVerified) {
          setActiveStep(2);
          
          // Call success callback after a short delay
          setTimeout(() => {
            if (onVerificationComplete) {
              onVerificationComplete(response.data?.phoneNumber || fullPhoneNumber);
            }
            onClose();
          }, 2000);
        } else {
          setError(response.data?.message || 'Verifizierung fehlgeschlagen. Bitte überprüfen Sie den Code.');
        }
      } catch (err: any) {
        console.error('Phone verification failed:', err);
        setError(
          err?.response?.data?.message || 
          err?.message || 
          'Verifizierung fehlgeschlagen. Bitte überprüfen Sie den Code.'
        );
      }
    });
  };

  // Handle resend code
  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    
    await withLoading('resendPhoneCode', async () => {
      try {
        setError(null);
        const response = await authService.sendPhoneVerificationCode(fullPhoneNumber);
        
        if (!response.success) {
          setError(response.message || 'Fehler beim erneuten Senden des Codes.');
          return;
        }
        
        if (response.data?.cooldownUntil) {
          const cooldownDate = new Date(response.data.cooldownUntil);
          const now = new Date();
          const cooldownSeconds = Math.max(0, Math.ceil((cooldownDate.getTime() - now.getTime()) / 1000));
          setResendCooldown(cooldownSeconds);
        } else {
          setResendCooldown(60);
        }
        
        if (response.data?.success) {
          codeForm.reset();
        } else {
          setError(response.data?.message || 'Code konnte nicht erneut gesendet werden.');
        }
      } catch (err: any) {
        console.error('Failed to resend code:', err);
        setError(
          err?.response?.data?.message || 
          err?.message || 
          'Fehler beim erneuten Senden des Codes.'
        );
      }
    });
  };

  // Handle single digit input for code
  const handleDigitInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    
    const newCode = codeValue.split('');
    newCode[index] = value.slice(-1);
    const updatedCode = newCode.join('').slice(0, 6);
    codeForm.setValue('code', updatedCode);
    
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit when all 6 digits are entered
    if (updatedCode.length === 6) {
      codeForm.handleSubmit(handleCodeSubmit)();
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !codeValue[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    codeForm.setValue('code', pastedData);
    
    if (pastedData.length === 6) {
      codeForm.handleSubmit(handleCodeSubmit)();
    }
  };

  // Render content based on step
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box component="form" onSubmit={phoneForm.handleSubmit(handlePhoneSubmit)}>
            <Stack spacing={3}>
              <Typography variant="body1">
                Geben Sie Ihre Telefonnummer ein. Wir senden Ihnen einen 
                Verifizierungscode per SMS.
              </Typography>
              
              <Stack direction="row" spacing={2}>
                <Controller
                  name="countryCode"
                  control={phoneForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Land"
                      variant="outlined"
                      sx={{ minWidth: 140 }}
                      disabled={isLoading('sendPhoneVerification')}
                    >
                      {countryCodes.map((country) => (
                        <MenuItem key={country.code} value={country.code}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{country.flag}</span>
                            <span>{country.code}</span>
                          </Box>
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
                
                <Controller
                  name="phoneNumber"
                  control={phoneForm.control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Telefonnummer"
                      variant="outlined"
                      fullWidth
                      placeholder="1234567890"
                      error={!!phoneForm.formState.errors.phoneNumber}
                      helperText={phoneForm.formState.errors.phoneNumber?.message}
                      disabled={isLoading('sendPhoneVerification')}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon />
                          </InputAdornment>
                        ),
                      }}
                      inputProps={{
                        maxLength: 15,
                        pattern: '[0-9]*',
                      }}
                    />
                  )}
                />
              </Stack>
              
              {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
            </Stack>
          </Box>
        );
        
      case 1:
        return (
          <Box>
            <Stack spacing={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Wir haben einen Verifizierungscode an
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {fullPhoneNumber}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  gesendet. Bitte geben Sie den 6-stelligen Code ein.
                </Typography>
              </Box>
              
              {/* Code Input Fields */}
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <TextField
                    key={index}
                    inputRef={(el) => (inputRefs.current[index] = el)}
                    value={codeValue[index] || ''}
                    onChange={(e) => handleDigitInput(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    disabled={isLoading('verifyPhoneCode')}
                    variant="outlined"
                    inputProps={{
                      maxLength: 1,
                      style: {
                        textAlign: 'center',
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        width: '50px',
                        height: '50px',
                        padding: 0,
                      },
                      'aria-label': `Ziffer ${index + 1}`,
                      autoComplete: 'off',
                    }}
                    error={!!codeForm.formState.errors.code && codeValue.length === 6}
                  />
                ))}
              </Box>
              
              {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
              
              {/* Resend Section */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Keinen Code erhalten?
                </Typography>
                <Button
                  onClick={handleResendCode}
                  variant="text"
                  startIcon={resendCooldown === 0 ? <RefreshIcon /> : null}
                  disabled={resendCooldown > 0 || isLoading('resendPhoneCode')}
                  sx={{ textTransform: 'none' }}
                >
                  {isLoading('resendPhoneCode') ? (
                    <CircularProgress size={20} />
                  ) : resendCooldown > 0 ? (
                    `Erneut senden in ${resendCooldown}s`
                  ) : (
                    'Code erneut senden'
                  )}
                </Button>
              </Box>
              
              {/* Hidden Controller for form validation */}
              <Controller
                name="code"
                control={codeForm.control}
                render={() => <></>}
              />
            </Stack>
          </Box>
        );
        
      case 2:
        return (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CheckCircleIcon 
              color="success" 
              sx={{ fontSize: 64, mb: 2 }} 
            />
            <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold' }}>
              Erfolgreich verifiziert!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ihre Telefonnummer wurde erfolgreich verifiziert.
            </Typography>
          </Box>
        );
        
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PhoneIcon color="primary" />
          <Typography variant="h6">
            {isEditMode ? 'Telefonnummer ändern' : 'Telefonnummer verifizieren'}
          </Typography>
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {/* Step Content */}
        {renderStepContent()}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        {activeStep === 0 && (
          <>
            <Button onClick={onClose} variant="outlined">
              Abbrechen
            </Button>
            <LoadingButton
              onClick={phoneForm.handleSubmit(handlePhoneSubmit)}
              variant="contained"
              color="primary"
              loading={isLoading('sendPhoneVerification')}
              disabled={!phoneForm.formState.isValid}
            >
              Code senden
            </LoadingButton>
          </>
        )}
        
        {activeStep === 1 && (
          <>
            <Button 
              onClick={() => setActiveStep(0)} 
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              disabled={isLoading('verifyPhoneCode')}
            >
              Zurück
            </Button>
            <LoadingButton
              onClick={codeForm.handleSubmit(handleCodeSubmit)}
              variant="contained"
              color="primary"
              loading={isLoading('verifyPhoneCode')}
              disabled={codeValue.length !== 6}
            >
              Verifizieren
            </LoadingButton>
          </>
        )}
        
        {activeStep === 2 && (
          <Button 
            onClick={onClose} 
            variant="contained"
            color="primary"
          >
            Fertig
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PhoneVerificationDialog;