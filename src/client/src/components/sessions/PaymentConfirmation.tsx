import React, { useState } from 'react';
import {
  Box,
  Stack,
  TextField,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Typography,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button as MuiButton,
} from '@mui/material';
import { Payment, CheckCircle } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store/store.hooks';
import type { RootState } from '../../store/store';
import { processSessionPayment } from '../../features/sessions/sessionsThunks';
import type { ProcessSessionPaymentRequest } from '../../api/services/sessionService';

interface PaymentConfirmationProps {
  appointmentId: string;
  payeeId: string;
  payeeName: string;
  amount: number;
  currency?: string;
  open?: boolean;
  onClose?: () => void;
  onSuccess?: () => void;
}

interface PaymentBreakdown {
  subtotal: number;
  platformFee: number;
  total: number;
  netAmount: number; // What payee receives
}

/**
 * PaymentConfirmation Component
 *
 * Handles payment processing for completed sessions:
 * - Payment amount confirmation
 * - Platform fee calculation
 * - Payment method selection
 * - Payment status tracking
 * - Transaction details
 */
const PaymentConfirmation: React.FC<PaymentConfirmationProps> = ({
  appointmentId,
  payeeId,
  payeeName,
  amount,
  currency = 'EUR',
  open = true,
  onClose,
  onSuccess,
}) => {
  const dispatch = useAppDispatch();
  const { isLoadingPayment, error, currentPayment } = useAppSelector(
    (state: RootState) => state.sessions
  );

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'stripe'>('card');
  const [token, setToken] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [platformFeePercent] = useState(10); // Default 10% platform fee

  // Calculate payment breakdown
  const calculateBreakdown = (): PaymentBreakdown => {
    const subtotal = amount;
    const platformFee = (subtotal * platformFeePercent) / 100;
    const netAmount = subtotal - platformFee;

    return {
      subtotal,
      platformFee,
      total: subtotal,
      netAmount,
    };
  };

  const breakdown = calculateBreakdown();

  const handlePaymentMethodChange = (method: 'card' | 'stripe'): void => {
    setPaymentMethod(method);
    setToken('');
    setValidationError(null);
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setToken(e.target.value);
    setValidationError(null);
  };

  const handleClose = (): void => {
    // Reset form
    setPaymentMethod('card');
    setToken('');
    setAgreedToTerms(false);
    setValidationError(null);
    onClose?.();
  };

  const handleSubmitPayment = async (): Promise<void> => {
    // Validation
    if (!agreedToTerms) {
      setValidationError('You must agree to the payment terms');
      return;
    }

    if (!token.trim()) {
      setValidationError('Payment method token is required');
      return;
    }

    const request: ProcessSessionPaymentRequest = {
      payeeId,
      amount,
      currency,
      paymentMethodToken: token,
      platformFeePercent,
    };

    try {
      const result = await dispatch(
        processSessionPayment({
          appointmentId,
          request,
        })
      );

      if (result.meta.requestStatus === 'fulfilled') {
        handleClose();
        onSuccess?.();
      }
    } catch (err) {
      console.error('Failed to process payment:', err);
    }
  };

  // If payment was successful, show success state
  if (currentPayment?.status === 'Completed') {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Payment Successful</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ textAlign: 'center', py: 2 }}>
            <CheckCircle sx={{ fontSize: 64, color: 'success.main', mx: 'auto' }} />
            <Typography variant="h6">Payment completed successfully!</Typography>

            <Divider />

            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1 }}>
                Transaction Details
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Transaction ID"
                    secondary={currentPayment.transactionId ?? 'N/A'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Amount"
                    secondary={`${breakdown.netAmount.toFixed(2)} ${currency}`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Status"
                    secondary={<Chip label={currentPayment.status} color="success" size="small" />}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Date"
                    secondary={
                      currentPayment.processedAt
                        ? new Date(currentPayment.processedAt).toLocaleString('en-DE')
                        : 'N/A'
                    }
                  />
                </ListItem>
              </List>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <MuiButton variant="contained" onClick={handleClose} fullWidth>
            Done
          </MuiButton>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Confirm Payment</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error.message ?? 'Failed to process payment'}</Alert>}

          {validationError && <Alert severity="warning">{validationError}</Alert>}

          {/* Payee Info */}
          <Box>
            <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1 }}>
              Payment to:
            </Typography>
            <Chip label={payeeName} variant="outlined" />
          </Box>

          {/* Payment Breakdown */}
          <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
            <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2 }}>
              Payment Breakdown
            </Typography>

            <List dense>
              <ListItem disableGutters>
                <ListItemText
                  primary="Subtotal"
                  secondary={`${breakdown.subtotal.toFixed(2)} ${currency}`}
                />
              </ListItem>
              <ListItem disableGutters>
                <ListItemText
                  primary={`Platform Fee (${String(platformFeePercent)}%)`}
                  secondary={`-${breakdown.platformFee.toFixed(2)} ${currency}`}
                />
              </ListItem>

              <Divider sx={{ my: 1 }} />

              <ListItem disableGutters sx={{ fontWeight: 600 }}>
                <ListItemText
                  primary="Payee Receives"
                  slotProps={{
                    primary: { fontWeight: 700 },
                    secondary: { fontWeight: 600 },
                  }}
                  secondary={`${breakdown.netAmount.toFixed(2)} ${currency}`}
                />
              </ListItem>
            </List>
          </Box>

          {/* Payment Method */}
          <Box>
            <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 2 }}>
              Payment Method
            </Typography>

            <Stack spacing={1}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={paymentMethod === 'card'}
                    onChange={() => {
                      handlePaymentMethodChange('card');
                    }}
                  />
                }
                label="Credit/Debit Card"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={paymentMethod === 'stripe'}
                    onChange={() => {
                      handlePaymentMethodChange('stripe');
                    }}
                  />
                }
                label="Stripe"
              />
            </Stack>
          </Box>

          {/* Payment Token Input */}
          <Box>
            <TextField
              fullWidth
              label={paymentMethod === 'card' ? 'Card Token (for demonstration)' : 'Stripe Token'}
              placeholder={
                paymentMethod === 'card'
                  ? 'Enter card token (e.g., tok_visa)'
                  : 'Enter Stripe payment token'
              }
              value={token}
              onChange={handleTokenChange}
              helperText="In production, use Stripe Elements for secure payment"
              variant="outlined"
              disabled={isLoadingPayment}
              type="password"
            />
          </Box>

          {/* Terms Agreement */}
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={agreedToTerms}
                  onChange={(e) => {
                    setAgreedToTerms(e.target.checked);
                  }}
                />
              }
              label={
                <Typography variant="caption">
                  I agree to the payment terms and confirm this transaction
                </Typography>
              }
            />
          </Box>

          {/* Info Alert */}
          <Alert severity="info">
            This is a payment confirmation dialog. In production, integrate with Stripe or similar
            payment processor for secure credit card processing.
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <MuiButton variant="outlined" onClick={handleClose} disabled={isLoadingPayment}>
          Cancel
        </MuiButton>
        <MuiButton
          variant="contained"
          onClick={handleSubmitPayment}
          disabled={!agreedToTerms || !token || isLoadingPayment}
          endIcon={isLoadingPayment ? <CircularProgress size={20} /> : <Payment />}
        >
          {isLoadingPayment ? 'Processing...' : `Pay ${breakdown.total.toFixed(2)} ${currency}`}
        </MuiButton>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentConfirmation;
