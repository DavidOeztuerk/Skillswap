import { createEntityAdapter, type EntityId, type EntityState } from '@reduxjs/toolkit';
import type { RequestState } from '../../../shared/types/common/RequestState';
import type { BoostType, PaymentProduct, PaymentStatusResponse } from '../types/Payment';

// Entity Adapter for PaymentProducts
export const paymentProductsAdapter = createEntityAdapter<PaymentProduct, EntityId>({
  selectId: (product) => product.id,
  sortComparer: (a, b) => a.sortOrder - b.sortOrder,
});

// Payment State Interface
export interface PaymentEntityState extends EntityState<PaymentProduct, EntityId>, RequestState {
  // Product IDs by type
  boostProductIds: string[];

  // Current checkout state
  currentCheckout: {
    paymentId: string | null;
    checkoutUrl: string | null;
    isProcessing: boolean;
    error: string | null;
  };

  // Payment status tracking
  paymentStatuses: Record<string, PaymentStatusResponse>;

  // UI State
  selectedProductId: string | null;
  isBoostModalOpen: boolean;
  currentListingId: string | null;
  currentSkillName: string | null;

  // Loading states for specific operations
  isLoadingProducts: boolean;
  isCreatingCheckout: boolean;
  isPollingStatus: boolean;
}

// Initial State
export const initialPaymentState: PaymentEntityState = paymentProductsAdapter.getInitialState({
  // Product IDs
  boostProductIds: [],

  // Checkout state
  currentCheckout: {
    paymentId: null,
    checkoutUrl: null,
    isProcessing: false,
    error: null,
  },

  // Payment statuses
  paymentStatuses: {},

  // UI State
  selectedProductId: null,
  isBoostModalOpen: false,
  currentListingId: null,
  currentSkillName: null,

  // Loading states
  isLoadingProducts: false,
  isCreatingCheckout: false,
  isPollingStatus: false,

  // RequestState
  isLoading: false,
  errorMessage: undefined,
});

// Adapter Selectors
export const paymentProductsSelectors = paymentProductsAdapter.getSelectors();

// API response type (sortOrder may be missing from API)
interface PaymentProductApiResponse {
  id: string;
  name: string;
  description: string;
  boostType: BoostType;
  price: number;
  currency: string;
  durationDays: number;
  sortOrder?: number;
}

// Mapping function for API response
export const mapPaymentProductResponse = (response: PaymentProductApiResponse): PaymentProduct => ({
  id: response.id,
  name: response.name,
  description: response.description,
  boostType: response.boostType,
  price: response.price,
  currency: response.currency,
  durationDays: response.durationDays,
  sortOrder: response.sortOrder ?? 0,
});
