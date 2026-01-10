import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { initialPaymentState, paymentProductsAdapter } from './paymentAdapter+State';
import {
  fetchPaymentProducts,
  createCheckoutSession,
  fetchPaymentStatus,
  pollPaymentStatus,
  initiateBoostCheckout,
} from './thunks/paymentThunks';

const paymentSlice = createSlice({
  name: 'payment',
  initialState: initialPaymentState,
  reducers: {
    // UI State Actions
    setSelectedProductId: (state, action: PayloadAction<string | null>) => {
      state.selectedProductId = action.payload;
    },

    openBoostModal: (state, action: PayloadAction<{ listingId: string; skillName: string }>) => {
      state.isBoostModalOpen = true;
      state.currentListingId = action.payload.listingId;
      state.currentSkillName = action.payload.skillName;
      state.selectedProductId = null;
      state.currentCheckout = {
        paymentId: null,
        checkoutUrl: null,
        isProcessing: false,
        error: null,
      };
    },

    closeBoostModal: (state) => {
      state.isBoostModalOpen = false;
      state.currentListingId = null;
      state.currentSkillName = null;
      state.selectedProductId = null;
      state.currentCheckout = {
        paymentId: null,
        checkoutUrl: null,
        isProcessing: false,
        error: null,
      };
    },

    // Error Management
    clearError: (state) => {
      delete state.errorMessage;
      state.currentCheckout.error = null;
    },

    clearCheckoutError: (state) => {
      state.currentCheckout.error = null;
    },

    // Reset checkout state
    resetCheckout: (state) => {
      state.currentCheckout = {
        paymentId: null,
        checkoutUrl: null,
        isProcessing: false,
        error: null,
      };
    },
  },
  extraReducers: (builder) => {
    // === FETCH PAYMENT PRODUCTS ===
    builder.addCase(fetchPaymentProducts.pending, (state) => {
      state.isLoading = true;
      state.isLoadingProducts = true;
      delete state.errorMessage;
    });
    builder.addCase(fetchPaymentProducts.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isLoadingProducts = false;
      // Use EntityAdapter's setMany to add/update products
      paymentProductsAdapter.setMany(state, action.payload.products);
      // Track boost product IDs
      state.boostProductIds = action.payload.products.map((p) => p.id);
      // Auto-select first product if none selected
      if (!state.selectedProductId && action.payload.products.length > 0) {
        state.selectedProductId = action.payload.products[0].id;
      }
    });
    builder.addCase(fetchPaymentProducts.rejected, (state, action) => {
      state.isLoading = false;
      state.isLoadingProducts = false;
      state.errorMessage =
        action.payload?.message ?? action.error.message ?? 'Failed to fetch payment products';
    });

    // === CREATE CHECKOUT SESSION ===
    builder.addCase(createCheckoutSession.pending, (state) => {
      state.isCreatingCheckout = true;
      state.currentCheckout.isProcessing = true;
      state.currentCheckout.error = null;
    });
    builder.addCase(createCheckoutSession.fulfilled, (state, action) => {
      state.isCreatingCheckout = false;
      state.currentCheckout.isProcessing = false;
      state.currentCheckout.paymentId = action.payload.paymentId;
      state.currentCheckout.checkoutUrl = action.payload.checkoutUrl;
    });
    builder.addCase(createCheckoutSession.rejected, (state, action) => {
      state.isCreatingCheckout = false;
      state.currentCheckout.isProcessing = false;
      state.currentCheckout.error =
        action.payload?.message ?? action.error.message ?? 'Failed to create checkout session';
    });

    // === FETCH PAYMENT STATUS ===
    builder.addCase(fetchPaymentStatus.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(fetchPaymentStatus.fulfilled, (state, action) => {
      state.isLoading = false;
      state.paymentStatuses[action.payload.paymentId] = action.payload;
    });
    builder.addCase(fetchPaymentStatus.rejected, (state, action) => {
      state.isLoading = false;
      state.errorMessage =
        action.payload?.message ?? action.error.message ?? 'Failed to fetch payment status';
    });

    // === POLL PAYMENT STATUS ===
    builder.addCase(pollPaymentStatus.pending, (state) => {
      state.isPollingStatus = true;
    });
    builder.addCase(pollPaymentStatus.fulfilled, (state, action) => {
      state.isPollingStatus = false;
      if (action.payload) {
        state.paymentStatuses[action.payload.paymentId] = action.payload;
      }
    });
    builder.addCase(pollPaymentStatus.rejected, (state, action) => {
      state.isPollingStatus = false;
      state.errorMessage =
        action.payload?.message ?? action.error.message ?? 'Failed to poll payment status';
    });

    // === INITIATE BOOST CHECKOUT ===
    builder.addCase(initiateBoostCheckout.pending, (state) => {
      state.isCreatingCheckout = true;
      state.currentCheckout.isProcessing = true;
      state.currentCheckout.error = null;
    });
    builder.addCase(initiateBoostCheckout.fulfilled, (state, action) => {
      state.isCreatingCheckout = false;
      state.currentCheckout.isProcessing = false;
      state.currentCheckout.paymentId = action.payload.paymentId;
      state.currentCheckout.checkoutUrl = action.payload.checkoutUrl;
    });
    builder.addCase(initiateBoostCheckout.rejected, (state, action) => {
      state.isCreatingCheckout = false;
      state.currentCheckout.isProcessing = false;
      state.currentCheckout.error =
        action.payload?.message ?? action.error.message ?? 'Failed to initiate boost checkout';
    });
  },
});

// Export actions
export const {
  setSelectedProductId,
  openBoostModal,
  closeBoostModal,
  clearError,
  clearCheckoutError,
  resetCheckout,
} = paymentSlice.actions;

export default paymentSlice.reducer;
