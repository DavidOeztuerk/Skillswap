/**
 * Payment types for Phase 11: Kostenpflichtiger Boost
 */

/**
 * Boost type enum
 */
export type BoostType = 'Refresh' | 'Highlight' | 'TopListing' | 'Gallery';

/**
 * Payment status enum
 */
export type PaymentStatus =
  | 'Pending'
  | 'Processing'
  | 'Succeeded'
  | 'Failed'
  | 'Refunded'
  | 'Cancelled';

/**
 * Payment product (boost option)
 */
export interface PaymentProduct {
  id: string;
  name: string;
  description: string;
  boostType: BoostType;
  price: number;
  currency: string;
  durationDays: number;
  sortOrder: number;
}

/**
 * Request to create a checkout session
 */
export interface CreateCheckoutSessionRequest {
  productId: string;
  referenceId?: string;
  referenceType?: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Response from creating a checkout session
 */
export interface CheckoutSessionResponse {
  paymentId: string;
  checkoutUrl: string;
}

/**
 * Payment status response
 */
export interface PaymentStatusResponse {
  paymentId: string;
  status: PaymentStatus;
  isCompleted: boolean;
  completedAt?: string;
}
