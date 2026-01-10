import { createAppAsyncThunk } from '../../../../core/store/thunkHelpers';
import { isSuccessResponse } from '../../../../shared/types/api/UnifiedResponse';
import { paymentService } from '../../services/paymentService';
import { mapPaymentProductResponse } from '../paymentAdapter+State';
import type {
  PaymentProduct,
  CreateCheckoutSessionRequest,
  CheckoutSessionResponse,
  PaymentStatusResponse,
} from '../../types/Payment';

/**
 * Fetch payment products (boost options)
 */
export const fetchPaymentProducts = createAppAsyncThunk<
  { products: PaymentProduct[] },
  string | undefined
>('payment/fetchProducts', async (productType, { rejectWithValue }) => {
  try {
    const response = await paymentService.getProducts(productType);

    if (!isSuccessResponse(response)) {
      console.error('[fetchPaymentProducts] Not a success response');
      return rejectWithValue(response);
    }

    const products = response.data.map(mapPaymentProductResponse);

    return { products };
  } catch (error) {
    console.error('[fetchPaymentProducts] Error:', error);
    return rejectWithValue({
      success: false,
      errors: [(error as Error).message || 'Failed to fetch payment products'],
      errorCode: 'FETCH_PAYMENT_PRODUCTS_ERROR',
    });
  }
});

/**
 * Create a Stripe checkout session
 */
export const createCheckoutSession = createAppAsyncThunk<
  CheckoutSessionResponse,
  CreateCheckoutSessionRequest
>('payment/createCheckoutSession', async (request, { rejectWithValue }) => {
  try {
    const response = await paymentService.createCheckoutSession(request);

    if (!isSuccessResponse(response)) {
      console.error('[createCheckoutSession] Not a success response');
      return rejectWithValue(response);
    }

    return response.data;
  } catch (error) {
    console.error('[createCheckoutSession] Error:', error);
    return rejectWithValue({
      success: false,
      errors: [(error as Error).message || 'Failed to create checkout session'],
      errorCode: 'CREATE_CHECKOUT_SESSION_ERROR',
    });
  }
});

/**
 * Get payment status
 */
export const fetchPaymentStatus = createAppAsyncThunk<PaymentStatusResponse, string>(
  'payment/fetchStatus',
  async (paymentId, { rejectWithValue }) => {
    try {
      const response = await paymentService.getPaymentStatus(paymentId);

      if (!isSuccessResponse(response)) {
        console.error('[fetchPaymentStatus] Not a success response');
        return rejectWithValue(response);
      }

      return response.data;
    } catch (error) {
      console.error('[fetchPaymentStatus] Error:', error);
      return rejectWithValue({
        success: false,
        errors: [(error as Error).message || 'Failed to fetch payment status'],
        errorCode: 'FETCH_PAYMENT_STATUS_ERROR',
      });
    }
  }
);

/**
 * Poll payment status until completed or failed
 */
export const pollPaymentStatus = createAppAsyncThunk<
  PaymentStatusResponse | null,
  { paymentId: string; maxAttempts?: number; intervalMs?: number }
>(
  'payment/pollStatus',
  async ({ paymentId, maxAttempts = 30, intervalMs = 2000 }, { rejectWithValue }) => {
    try {
      return await paymentService.pollPaymentStatus(paymentId, maxAttempts, intervalMs);
    } catch (error) {
      console.error('[pollPaymentStatus] Error:', error);
      return rejectWithValue({
        success: false,
        errors: [(error as Error).message || 'Failed to poll payment status'],
        errorCode: 'POLL_PAYMENT_STATUS_ERROR',
      });
    }
  }
);

/**
 * Initiate boost checkout flow
 * Combines product selection with checkout session creation
 */
export const initiateBoostCheckout = createAppAsyncThunk<
  CheckoutSessionResponse,
  { productId: string; listingId: string }
>('payment/initiateBoostCheckout', async ({ productId, listingId }, { rejectWithValue }) => {
  try {
    const request: CreateCheckoutSessionRequest = {
      productId,
      referenceId: listingId,
      referenceType: 'ListingBoost',
      successUrl: `${window.location.origin}/skills/my-skills?boost=success&listing=${listingId}`,
      cancelUrl: `${window.location.origin}/skills/my-skills?boost=cancelled&listing=${listingId}`,
    };

    const response = await paymentService.createCheckoutSession(request);

    if (!isSuccessResponse(response)) {
      console.error('[initiateBoostCheckout] Not a success response');
      return rejectWithValue(response);
    }

    return response.data;
  } catch (error) {
    console.error('[initiateBoostCheckout] Error:', error);
    return rejectWithValue({
      success: false,
      errors: [(error as Error).message || 'Failed to initiate boost checkout'],
      errorCode: 'INITIATE_BOOST_CHECKOUT_ERROR',
    });
  }
});
