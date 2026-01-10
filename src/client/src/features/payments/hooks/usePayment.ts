import { useMemo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../core/store/store.hooks';
import {
  selectBoostProducts,
  selectSelectedProduct,
  selectSelectedProductId,
  selectCurrentCheckout,
  selectIsBoostModalOpen,
  selectCurrentListingId,
  selectCurrentSkillName,
  selectIsLoadingProducts,
  selectIsCreatingCheckout,
  selectIsPollingStatus,
  selectPaymentStatuses,
  selectCheckoutError,
  selectPaymentLoading,
  selectPaymentError,
} from '../store/paymentSelectors';
import {
  setSelectedProductId,
  openBoostModal,
  closeBoostModal,
  clearError,
  clearCheckoutError,
  resetCheckout,
} from '../store/paymentSlice';
import {
  fetchPaymentProducts,
  createCheckoutSession,
  fetchPaymentStatus,
  pollPaymentStatus,
  initiateBoostCheckout,
} from '../store/thunks/paymentThunks';
import type {
  CreateCheckoutSessionRequest,
  PaymentProduct,
  PaymentStatusResponse,
} from '../types/Payment';

// Return type for usePayment hook
interface UsePaymentReturn {
  // State
  boostProducts: PaymentProduct[];
  selectedProduct: PaymentProduct | null;
  selectedProductId: string | null;
  currentCheckout: {
    paymentId: string | null;
    checkoutUrl: string | null;
    isProcessing: boolean;
    error: string | null;
  };
  isBoostModalOpen: boolean;
  currentListingId: string | null;
  currentSkillName: string | null;
  paymentStatuses: Record<string, PaymentStatusResponse>;

  // Loading states
  isLoading: boolean;
  isLoadingProducts: boolean;
  isCreatingCheckout: boolean;
  isPollingStatus: boolean;

  // Error states
  error: string | undefined;
  checkoutError: string | null;

  // Actions
  fetchProducts: (productType?: string) => void;
  fetchBoostProducts: () => void;
  createCheckout: (request: CreateCheckoutSessionRequest) => void;
  initiateBoost: (productId: string, listingId: string) => Promise<unknown>;
  fetchStatus: (paymentId: string) => void;
  pollStatus: (paymentId: string, maxAttempts?: number, intervalMs?: number) => unknown;
  selectProduct: (productId: string | null) => void;
  openModal: (listingId: string, skillName: string) => void;
  closeModal: () => void;
  clearError: () => void;
  clearCheckoutError: () => void;
  resetCheckout: () => void;

  // Computed
  getProductById: (productId: string) => PaymentProduct | null;
  getPaymentStatus: (paymentId: string) => PaymentStatusResponse | null;
  isPaymentCompleted: (paymentId: string) => boolean;
  isPaymentSucceeded: (paymentId: string) => boolean;
  isAnyLoading: () => boolean;
  hasError: () => boolean;
  getAllErrors: () => string[];

  // Convenience method
  handleBoost: () => Promise<void>;

  // Legacy aliases
  products: PaymentProduct[];
  loading: boolean;
  processing: boolean;
}

/**
 * Hook for payment operations and state management
 */
export const usePayment = (): UsePaymentReturn => {
  const dispatch = useAppDispatch();

  // Selectors
  const boostProducts = useAppSelector(selectBoostProducts);
  const selectedProduct = useAppSelector(selectSelectedProduct);
  const selectedProductId = useAppSelector(selectSelectedProductId);
  const currentCheckout = useAppSelector(selectCurrentCheckout);
  const isBoostModalOpen = useAppSelector(selectIsBoostModalOpen);
  const currentListingId = useAppSelector(selectCurrentListingId);
  const currentSkillName = useAppSelector(selectCurrentSkillName);
  const isLoadingProducts = useAppSelector(selectIsLoadingProducts);
  const isCreatingCheckout = useAppSelector(selectIsCreatingCheckout);
  const isPollingStatus = useAppSelector(selectIsPollingStatus);
  const paymentStatuses = useAppSelector(selectPaymentStatuses);
  const checkoutError = useAppSelector(selectCheckoutError);
  const isLoading = useAppSelector(selectPaymentLoading);
  const error = useAppSelector(selectPaymentError);

  // Memoized actions
  const actions = useMemo(
    () => ({
      // Fetch payment products
      fetchProducts: (productType?: string): void => {
        void dispatch(fetchPaymentProducts(productType));
      },

      // Fetch boost products specifically
      fetchBoostProducts: (): void => {
        void dispatch(fetchPaymentProducts('ListingBoost'));
      },

      // Create checkout session
      createCheckout: (request: CreateCheckoutSessionRequest): void => {
        void dispatch(createCheckoutSession(request));
      },

      // Initiate boost checkout (simplified flow)
      initiateBoost: async (productId: string, listingId: string): Promise<unknown> => {
        const result = await dispatch(initiateBoostCheckout({ productId, listingId }));
        // RTK's match() is a type guard, not String.prototype.match()
        // eslint-disable-next-line unicorn/prefer-regexp-test
        if (initiateBoostCheckout.fulfilled.match(result)) {
          // Redirect to Stripe Checkout
          window.location.href = result.payload.checkoutUrl;
        }
        return result;
      },

      // Fetch payment status
      fetchStatus: (paymentId: string): void => {
        void dispatch(fetchPaymentStatus(paymentId));
      },

      // Poll payment status
      pollStatus: (paymentId: string, maxAttempts?: number, intervalMs?: number) =>
        dispatch(pollPaymentStatus({ paymentId, maxAttempts, intervalMs })),

      // UI Actions
      selectProduct: (productId: string | null): void => {
        dispatch(setSelectedProductId(productId));
      },

      openModal: (listingId: string, skillName: string): void => {
        dispatch(openBoostModal({ listingId, skillName }));
      },

      closeModal: (): void => {
        dispatch(closeBoostModal());
      },

      // Error management
      clearError: (): void => {
        dispatch(clearError());
      },

      clearCheckoutError: (): void => {
        dispatch(clearCheckoutError());
      },

      resetCheckout: (): void => {
        dispatch(resetCheckout());
      },
    }),
    [dispatch]
  );

  // Computed values
  const computed = useMemo(
    () => ({
      // Get product by ID
      getProductById: (productId: string): PaymentProduct | null =>
        boostProducts.find((p) => p.id === productId) ?? null,

      // Get payment status by ID
      getPaymentStatus: (paymentId: string): PaymentStatusResponse | null =>
        paymentStatuses[paymentId] ?? null,

      // Check if payment is completed
      isPaymentCompleted: (paymentId: string): boolean => {
        const status = paymentStatuses[paymentId] as PaymentStatusResponse | undefined;
        return status?.isCompleted === true;
      },

      // Check if payment succeeded
      isPaymentSucceeded: (paymentId: string): boolean => {
        const status = paymentStatuses[paymentId] as PaymentStatusResponse | undefined;
        return status?.status === 'Succeeded';
      },

      // Check if any loading
      isAnyLoading: (): boolean =>
        isLoading || isLoadingProducts || isCreatingCheckout || isPollingStatus,

      // Check if has error
      hasError: (): boolean => Boolean(error) || Boolean(checkoutError),

      // Get all errors
      getAllErrors: (): string[] => {
        const errors: string[] = [];
        if (error) errors.push(error);
        if (checkoutError) errors.push(checkoutError);
        return errors;
      },
    }),
    [
      boostProducts,
      paymentStatuses,
      isLoading,
      isLoadingProducts,
      isCreatingCheckout,
      isPollingStatus,
      error,
      checkoutError,
    ]
  );

  // Handle boost flow
  const handleBoost = useCallback(async (): Promise<void> => {
    if (!selectedProductId || !currentListingId) return;
    await actions.initiateBoost(selectedProductId, currentListingId);
  }, [selectedProductId, currentListingId, actions]);

  return {
    // State
    boostProducts,
    selectedProduct,
    selectedProductId,
    currentCheckout,
    isBoostModalOpen,
    currentListingId,
    currentSkillName,
    paymentStatuses,

    // Loading states
    isLoading,
    isLoadingProducts,
    isCreatingCheckout,
    isPollingStatus,

    // Error states
    error,
    checkoutError,

    // Actions
    ...actions,

    // Computed
    ...computed,

    // Convenience method
    handleBoost,

    // Legacy aliases
    products: boostProducts,
    loading: isLoading || isLoadingProducts,
    processing: isCreatingCheckout,
  };
};

export default usePayment;
