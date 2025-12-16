import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Paper,
  IconButton,
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

interface TwoFactorInputProps {
  onSubmit: (code: string) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  error?: string | null;
  title?: string;
  description?: string;
}

const TwoFactorInput: React.FC<TwoFactorInputProps> = ({
  onSubmit,
  onCancel,
  loading = false,
  error = null,
  title = 'Two-Factor Authentication',
  description = 'Enter the 6-digit code from your authenticator app',
}) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [localError, setLocalError] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  // Define handleSubmit BEFORE handleChange to avoid use-before-define
  const handleSubmit = async (fullCode?: string): Promise<void> => {
    const codeToSubmit = fullCode ?? code.join('');

    if (codeToSubmit.length !== 6) {
      setLocalError('Please enter all 6 digits');
      return;
    }

    try {
      await onSubmit(codeToSubmit);
    } catch (err: unknown) {
      console.error('2FA submission error:', err);
    }
  };

  const handleChange = (index: number, value: string): void => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setLocalError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all digits entered
    if (index === 5 && value) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        void handleSubmit(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter') {
      const fullCode = code.join('');
      if (fullCode.length === 6) {
        void handleSubmit(fullCode);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent): void => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...code];

    for (let i = 0; i < pastedData.length && i < 6; i++) {
      newCode[i] = pastedData[i] ?? '';
    }

    setCode(newCode);

    // Focus last filled input or last input if all filled
    const lastFilledIndex = Math.min(pastedData.length - 1, 5);
    inputRefs.current[lastFilledIndex]?.focus();

    // Auto-submit if 6 digits pasted
    if (pastedData.length === 6) {
      void handleSubmit(pastedData);
    }
  };

  const handleReset = (): void => {
    setCode(['', '', '', '', '', '']);
    setLocalError('');
    inputRefs.current[0]?.focus();
  };

  const displayError = error ?? localError;

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 400, mx: 'auto' }}>
      <Typography variant="h5" align="center" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 3 }}>
        {description}
      </Typography>

      <Box display="flex" justifyContent="center" gap={1} mb={3}>
        {code.map((digit, index) => (
          <TextField
            key={index}
            inputRef={(el: HTMLInputElement | null) => {
              inputRefs.current[index] = el;
            }}
            value={digit}
            onChange={(e) => {
              handleChange(index, e.target.value);
            }}
            onKeyDown={(e) => {
              handleKeyDown(index, e);
            }}
            onPaste={handlePaste}
            variant="outlined"
            slotProps={{
              input: {
                inputProps: {
                  maxLength: 1,
                  style: {
                    textAlign: 'center',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    width: '40px',
                    height: '40px',
                    padding: '8px',
                  },
                },
              },
            }}
            disabled={loading}
            error={displayError !== ''}
          />
        ))}
        <IconButton
          onClick={handleReset}
          size="small"
          disabled={loading}
          sx={{ alignSelf: 'center' }}
        >
          <RefreshIcon />
        </IconButton>
      </Box>

      {displayError !== '' && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {displayError}
        </Alert>
      )}

      <Box display="flex" gap={2} justifyContent="center">
        <Button
          variant="contained"
          onClick={() => {
            void handleSubmit();
          }}
          disabled={loading || code.join('').length !== 6}
          fullWidth
        >
          {loading ? <CircularProgress size={24} /> : 'Verify'}
        </Button>
        {onCancel && (
          <Button variant="outlined" onClick={onCancel} disabled={loading} fullWidth>
            Cancel
          </Button>
        )}
      </Box>

      <Typography
        variant="caption"
        color="textSecondary"
        align="center"
        display="block"
        sx={{ mt: 2 }}
      >
        Can't access your authenticator? Contact support for assistance.
      </Typography>
    </Paper>
  );
};

export default TwoFactorInput;
