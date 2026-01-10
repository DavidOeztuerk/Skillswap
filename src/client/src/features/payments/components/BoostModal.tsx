import React, { useEffect } from 'react';
import {
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  EmojiEvents as TrophyIcon,
  PhotoLibrary as GalleryIcon,
} from '@mui/icons-material';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { usePayment } from '../hooks/usePayment';
import type { BoostType } from '../types/Payment';

interface BoostModalProps {
  open: boolean;
  onClose: () => void;
  listingId: string;
  skillName: string;
}

const BOOST_ICONS: Record<BoostType, React.ReactNode> = {
  Refresh: <TrendingUpIcon />,
  Highlight: <StarIcon />,
  TopListing: <TrophyIcon />,
  Gallery: <GalleryIcon />,
};

const BOOST_COLORS: Record<BoostType, string> = {
  Refresh: '#4caf50',
  Highlight: '#9c27b0',
  TopListing: '#ff9800',
  Gallery: '#2196f3',
};

export const BoostModal: React.FC<BoostModalProps> = ({ open, onClose, listingId, skillName }) => {
  // Use Redux hook for state management
  const {
    boostProducts,
    selectedProductId,
    selectedProduct,
    isLoadingProducts,
    isCreatingCheckout,
    checkoutError,
    error,
    fetchBoostProducts,
    selectProduct,
    initiateBoost,
    clearCheckoutError,
  } = usePayment();

  // Load products when modal opens
  useEffect(() => {
    if (open) {
      fetchBoostProducts();
      clearCheckoutError();
    }
  }, [open, fetchBoostProducts, clearCheckoutError]);

  const handleProductSelect = (productId: string): void => {
    selectProduct(productId);
  };

  const handleBoostClick = async (): Promise<void> => {
    if (!selectedProductId) return;
    await initiateBoost(selectedProductId, listingId);
  };

  const handleClose = (): void => {
    clearCheckoutError();
    onClose();
  };

  const displayError = checkoutError ?? error;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <TrendingUpIcon color="primary" />
          <Typography variant="h6">Listing boosten</Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {displayError ? (
          <Alert severity="error" sx={{ mb: 2 }} onClose={clearCheckoutError}>
            {displayError}
          </Alert>
        ) : null}

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Erhöhe die Sichtbarkeit deines Skills &quot;{skillName}&quot; mit einem Boost:
        </Typography>

        {isLoadingProducts ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <RadioGroup
            value={selectedProductId ?? ''}
            onChange={(e) => handleProductSelect(e.target.value)}
          >
            {boostProducts.map((product) => (
              <Paper
                key={product.id}
                variant="outlined"
                sx={{
                  p: 2,
                  mb: 1.5,
                  cursor: 'pointer',
                  borderColor: selectedProductId === product.id ? 'primary.main' : 'divider',
                  borderWidth: selectedProductId === product.id ? 2 : 1,
                  transition: 'border-color 0.2s',
                  '&:hover': {
                    borderColor: 'primary.light',
                  },
                }}
                onClick={() => handleProductSelect(product.id)}
              >
                <FormControlLabel
                  value={product.id}
                  control={<Radio />}
                  sx={{ width: '100%', m: 0 }}
                  label={
                    <Box sx={{ width: '100%' }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box sx={{ color: BOOST_COLORS[product.boostType] }}>
                            {BOOST_ICONS[product.boostType]}
                          </Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {product.name}
                          </Typography>
                        </Box>
                        <Chip
                          label={`${product.price.toFixed(2)} ${product.currency}`}
                          color="primary"
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {product.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Dauer: {product.durationDays} Tage
                      </Typography>
                    </Box>
                  }
                />
              </Paper>
            ))}
          </RadioGroup>
        )}

        {selectedProduct ? (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Zusammenfassung
            </Typography>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2">{selectedProduct.name}</Typography>
              <Typography variant="h6" color="primary">
                {selectedProduct.price.toFixed(2)} {selectedProduct.currency}
              </Typography>
            </Box>
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={isCreatingCheckout}>
          Abbrechen
        </Button>
        <Button
          onClick={handleBoostClick}
          variant="contained"
          disabled={!selectedProductId || isCreatingCheckout || isLoadingProducts}
          startIcon={isCreatingCheckout ? <CircularProgress size={20} /> : <TrendingUpIcon />}
        >
          {isCreatingCheckout ? 'Wird verarbeitet...' : 'Zur Zahlung'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BoostModal;
