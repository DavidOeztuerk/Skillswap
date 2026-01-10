import { apiClient } from '../../../core/api/apiClient';
import { PAYMENT_ENDPOINTS } from '../../../core/config/endpoints';
import { isSuccessResponse } from '../../../shared/types/api/UnifiedResponse';
import type { ApiResponse } from '../../../shared/types/api/UnifiedResponse';
import type {
  PaymentProduct,
  CreateCheckoutSessionRequest,
  CheckoutSessionResponse,
  PaymentStatusResponse,
} from '../types/Payment';

/**
 * Service for payment operations
 * Phase 11: Kostenpflichtiger Boost
 */
export const paymentService = {
  /**
   * Get available payment products (boost options)
   * @param type - Optional filter by product type (e.g., 'ListingBoost')
   */
  async getProducts(type?: string): Promise<ApiResponse<PaymentProduct[]>> {
    return apiClient.get<PaymentProduct[]>(PAYMENT_ENDPOINTS.GET_PRODUCTS, { type });
  },

  /**
   * Create a Stripe checkout session
   * @param request - Checkout session request
   * @returns Checkout session with payment ID and redirect URL
   */
  async createCheckoutSession(
    request: CreateCheckoutSessionRequest
  ): Promise<ApiResponse<CheckoutSessionResponse>> {
    return apiClient.post<CheckoutSessionResponse>(
      PAYMENT_ENDPOINTS.CREATE_CHECKOUT_SESSION,
      request
    );
  },

  /**
   * Get payment status
   * @param paymentId - The payment ID to check
   * @returns Payment status
   */
  async getPaymentStatus(paymentId: string): Promise<ApiResponse<PaymentStatusResponse>> {
    return apiClient.get<PaymentStatusResponse>(PAYMENT_ENDPOINTS.GET_PAYMENT_STATUS(paymentId));
  },

  /**
   * Poll payment status until completed or failed
   * Uses recursive approach to avoid await-in-loop lint warnings
   * @param paymentId - The payment ID to poll
   * @param maxAttempts - Maximum number of polling attempts
   * @param intervalMs - Interval between polls in milliseconds
   * @returns Final payment status
   */
  async pollPaymentStatus(
    paymentId: string,
    maxAttempts = 30,
    intervalMs = 2000
  ): Promise<PaymentStatusResponse | null> {
    const poll = async (attempt: number): Promise<PaymentStatusResponse | null> => {
      if (attempt >= maxAttempts) {
        return null;
      }

      try {
        const response = await this.getPaymentStatus(paymentId);
        if (isSuccessResponse(response)) {
          const status = response.data;
          if (status.isCompleted || status.status === 'Failed' || status.status === 'Cancelled') {
            return status;
          }
        }
      } catch {
        // Continue polling on error
      }

      // Wait and retry
      await new Promise<void>((resolve) => {
        setTimeout(resolve, intervalMs);
      });
      return poll(attempt + 1);
    };

    return poll(0);
  },
};
