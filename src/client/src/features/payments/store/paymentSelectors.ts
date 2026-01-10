import { createSelector } from '@reduxjs/toolkit';
import { type PaymentEntityState, paymentProductsAdapter } from './paymentAdapter+State';
import type { RootState } from '../../../core/store/store';

/**
 * Payment Selectors
 * Centralized selectors for payment state and entity operations
 */

// Base selectors
export const selectPaymentState = (state: RootState): PaymentEntityState => state.payment;
export const selectPaymentLoading = (state: RootState): boolean => state.payment.isLoading;
export const selectPaymentError = (state: RootState): string | undefined =>
  state.payment.errorMessage;

// EntityAdapter selectors
const adapterSelectors = paymentProductsAdapter.getSelectors<RootState>((state) => state.payment);

// Export EntityAdapter's built-in selectors
export const {
  selectAll: selectAllPaymentProducts,
  selectById: selectPaymentProductById,
  selectIds: selectPaymentProductIds,
  selectEntities: selectPaymentProductEntities,
} = adapterSelectors;

// Boost products selector
export const selectBoostProducts = createSelector(
  [selectPaymentProductEntities, (state: RootState) => state.payment.boostProductIds],
  (entities, boostProductIds) => boostProductIds.map((id) => entities[id]).filter(Boolean)
);

// Selected product selector
export const selectSelectedProductId = createSelector(
  [selectPaymentState],
  (paymentState) => paymentState.selectedProductId
);

export const selectSelectedProduct = createSelector(
  [selectPaymentProductEntities, selectSelectedProductId],
  (entities, selectedId) => (selectedId ? (entities[selectedId] ?? null) : null)
);

// Checkout state selectors
export const selectCurrentCheckout = createSelector(
  [selectPaymentState],
  (paymentState) => paymentState.currentCheckout
);

export const selectCheckoutUrl = createSelector(
  [selectCurrentCheckout],
  (checkout) => checkout.checkoutUrl
);

export const selectIsProcessingCheckout = createSelector(
  [selectCurrentCheckout],
  (checkout) => checkout.isProcessing
);

export const selectCheckoutError = createSelector(
  [selectCurrentCheckout],
  (checkout) => checkout.error
);

export const selectCurrentPaymentId = createSelector(
  [selectCurrentCheckout],
  (checkout) => checkout.paymentId
);

// Modal state selectors
export const selectIsBoostModalOpen = createSelector(
  [selectPaymentState],
  (paymentState) => paymentState.isBoostModalOpen
);

export const selectCurrentListingId = createSelector(
  [selectPaymentState],
  (paymentState) => paymentState.currentListingId
);

export const selectCurrentSkillName = createSelector(
  [selectPaymentState],
  (paymentState) => paymentState.currentSkillName
);

// Loading states
export const selectIsLoadingProducts = createSelector(
  [selectPaymentState],
  (paymentState) => paymentState.isLoadingProducts
);

export const selectIsCreatingCheckout = createSelector(
  [selectPaymentState],
  (paymentState) => paymentState.isCreatingCheckout
);

export const selectIsPollingStatus = createSelector(
  [selectPaymentState],
  (paymentState) => paymentState.isPollingStatus
);

// Payment status selectors
export const selectPaymentStatuses = createSelector(
  [selectPaymentState],
  (paymentState) => paymentState.paymentStatuses
);

export const selectPaymentStatusById = createSelector(
  [selectPaymentStatuses, (_: RootState, paymentId: string) => paymentId],
  (statuses, paymentId) => statuses[paymentId] ?? null
);

// Computed selectors
export const selectIsPaymentCompleted = createSelector(
  [selectPaymentStatuses, (_: RootState, paymentId: string) => paymentId],
  (statuses, paymentId) => {
    const status = statuses[paymentId];
    return status.isCompleted;
  }
);

export const selectIsPaymentSucceeded = createSelector(
  [selectPaymentStatuses, (_: RootState, paymentId: string) => paymentId],
  (statuses, paymentId) => {
    const status = statuses[paymentId];
    return status.status === 'Succeeded';
  }
);

// Get products sorted by price
export const selectBoostProductsByPrice = createSelector([selectBoostProducts], (products) =>
  [...products].sort((a, b) => a.price - b.price)
);

// Get product by boost type
export const selectProductByBoostType = createSelector(
  [selectBoostProducts, (_: RootState, boostType: string) => boostType],
  (products, boostType) => products.find((p) => p.boostType === boostType) ?? null
);
