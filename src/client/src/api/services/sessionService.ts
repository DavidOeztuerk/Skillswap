import { APPOINTMENT_ENDPOINTS } from '../../config/endpoints';
import { apiClient } from '../apiClient';
import type { ApiResponse } from '../../types/api/UnifiedResponse';

/**
 * Session lifecycle request/response interfaces
 */
// Empty body - appointmentId comes from route parameter
export type StartSessionRequest = Record<string, never>;

export interface CompleteSessionRequest {
  isNoShow?: boolean;
  noShowReason?: string | null;
}

export interface RateSessionRequest {
  rating: number;
  feedback?: string | null;
  isPublic?: boolean;
  wouldRecommend?: boolean | null;
  tags?: string | null;
}

export interface RescheduleSessionRequest {
  proposedDate: string; // ISO string
  proposedDurationMinutes?: number | null;
  reason?: string | null;
}

export interface CancelSessionRequest {
  reason?: string | null;
}

export interface ProcessSessionPaymentRequest {
  payeeId: string;
  amount: number;
  currency?: string;
  paymentMethodToken?: string | null;
  platformFeePercent?: number | null;
}

// Response interfaces
export interface SessionStatusResponse {
  sessionAppointmentId: string;
  status: string;
  timestamp?: string | null;
  meetingLink?: string | null;
}

export interface RatingResponse {
  ratingId: string;
  rating: number;
  feedback?: string | null;
  createdAt: string;
}

export interface PaymentResponse {
  paymentId: string;
  status: string;
  amount: number;
  currency: string;
  transactionId?: string | null;
  processedAt?: string | null;
}

/**
 * Session Lifecycle Service
 *
 * Handles all operations related to session execution:
 * - Starting sessions when time arrives
 * - Completing sessions and marking no-shows
 * - Rating sessions with feedback
 * - Processing payments
 * - Requesting/handling rescheduling
 * - Canceling sessions with late cancellation tracking
 */
const sessionService = {
  /**
   * Start a confirmed appointment session
   * Typically called 5 minutes before scheduled time
   *
   * @param appointmentId - The appointment/session ID to start
   * @returns Session status response
   */
  async startSession(appointmentId: string): Promise<ApiResponse<SessionStatusResponse>> {
    if (!appointmentId.trim()) throw new Error('Appointment ID is required');

    return await apiClient.post<SessionStatusResponse>(
      `${APPOINTMENT_ENDPOINTS.START_SESSION}/${appointmentId}/start`,
      {}
    );
  },

  /**
   * Complete a session (mark as completed or no-show)
   * Called after session ends
   *
   * @param appointmentId - The appointment/session ID to complete
   * @param request - Completion details (no-show status and reason if applicable)
   * @returns Session status response
   */
  async completeSession(
    appointmentId: string,
    request?: CompleteSessionRequest
  ): Promise<ApiResponse<SessionStatusResponse>> {
    if (!appointmentId.trim()) throw new Error('Appointment ID is required');

    return await apiClient.post<SessionStatusResponse>(
      `${APPOINTMENT_ENDPOINTS.COMPLETE_SESSION}/${appointmentId}/complete-session`,
      {
        isNoShow: request?.isNoShow ?? false,
        noShowReason: request?.noShowReason ?? null,
      }
    );
  },

  /**
   * Rate a completed session
   * Called after session completion
   *
   * @param appointmentId - The appointment/session ID to rate
   * @param request - Rating details (score, feedback, recommendation, etc.)
   * @returns Rating response
   */
  async rateSession(
    appointmentId: string,
    request: RateSessionRequest
  ): Promise<ApiResponse<RatingResponse>> {
    if (!appointmentId.trim()) throw new Error('Appointment ID is required');
    if (!request.rating || request.rating < 1 || request.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    return await apiClient.post<RatingResponse>(
      `${APPOINTMENT_ENDPOINTS.RATE_SESSION}/${appointmentId}/rate-session`,
      {
        rating: request.rating,
        feedback: request.feedback ?? null,
        isPublic: request.isPublic !== false,
        wouldRecommend: request.wouldRecommend ?? null,
        tags: request.tags ?? null,
      }
    );
  },

  /**
   * Request to reschedule a session
   * Creates a reschedule request for the other participant to approve
   *
   * @param appointmentId - The appointment/session ID to reschedule
   * @param request - Proposed reschedule details (new date, duration, reason)
   * @returns Session status response
   */
  async rescheduleSession(
    appointmentId: string,
    request: RescheduleSessionRequest
  ): Promise<ApiResponse<SessionStatusResponse>> {
    if (!appointmentId.trim()) throw new Error('Appointment ID is required');
    if (!request.proposedDate) throw new Error('Proposed date is required');

    const proposedDate = new Date(request.proposedDate);
    if (proposedDate <= new Date()) {
      throw new Error('Proposed date must be in the future');
    }

    return await apiClient.post<SessionStatusResponse>(
      `${APPOINTMENT_ENDPOINTS.RESCHEDULE_SESSION}/${appointmentId}/reschedule-session`,
      {
        proposedDate: request.proposedDate,
        proposedDurationMinutes: request.proposedDurationMinutes ?? null,
        reason: request.reason ?? null,
      }
    );
  },

  /**
   * Cancel a session
   * Automatically tracks late cancellations (within 24 hours)
   *
   * @param appointmentId - The appointment/session ID to cancel
   * @param reason - Optional cancellation reason
   * @returns Session status response
   */
  async cancelSession(
    appointmentId: string,
    reason?: string
  ): Promise<ApiResponse<SessionStatusResponse>> {
    if (!appointmentId.trim()) throw new Error('Appointment ID is required');

    return await apiClient.post<SessionStatusResponse>(
      `${APPOINTMENT_ENDPOINTS.CANCEL_SESSION}/${appointmentId}/cancel-session`,
      {
        reason: reason ?? null,
      }
    );
  },

  /**
   * Process payment for a completed session
   * Handles payment processing, retry logic, and platform fees
   *
   * @param appointmentId - The appointment/session ID for which to process payment
   * @param request - Payment details (payee ID, amount, currency, payment method, fees)
   * @returns Payment response with status and transaction details
   */
  async processSessionPayment(
    appointmentId: string,
    request: ProcessSessionPaymentRequest
  ): Promise<ApiResponse<PaymentResponse>> {
    if (!appointmentId.trim()) throw new Error('Appointment ID is required');
    if (!request.payeeId.trim()) throw new Error('Payee ID is required');
    if (!request.amount || request.amount <= 0) throw new Error('Amount must be greater than 0');
    if (request.currency?.length !== 3) {
      throw new Error('Currency must be a valid 3-character code');
    }

    return await apiClient.post<PaymentResponse>(
      `${APPOINTMENT_ENDPOINTS.PROCESS_PAYMENT}/${appointmentId}/payment`,
      {
        payeeId: request.payeeId,
        amount: request.amount,
        currency: request.currency ?? 'EUR',
        paymentMethodToken: request.paymentMethodToken ?? null,
        platformFeePercent: request.platformFeePercent ?? null,
      }
    );
  },

  /**
   * Batch operations for session lifecycle
   */

  /**
   * Complete session and immediately rate it
   * Convenience method for completing and rating in sequence
   *
   * @param appointmentId - The appointment/session ID
   * @param completeRequest - Session completion details
   * @param rateRequest - Rating details
   * @returns Object with both completion and rating responses
   */
  async completeAndRateSession(
    appointmentId: string,
    completeRequest?: CompleteSessionRequest,
    rateRequest?: RateSessionRequest
  ): Promise<{
    completion: ApiResponse<SessionStatusResponse>;
    rating: ApiResponse<RatingResponse> | null;
  }> {
    const completion = await this.completeSession(appointmentId, completeRequest);

    let rating: ApiResponse<RatingResponse> | null = null;
    if (rateRequest && completion.success) {
      rating = await this.rateSession(appointmentId, rateRequest);
    }

    return { completion, rating };
  },

  /**
   * Complete session and process payment
   * Convenience method for completing and processing payment in sequence
   *
   * @param appointmentId - The appointment/session ID
   * @param completeRequest - Session completion details
   * @param paymentRequest - Payment details
   * @returns Object with both completion and payment responses
   */
  async completeSessionAndProcessPayment(
    appointmentId: string,
    completeRequest?: CompleteSessionRequest,
    paymentRequest?: ProcessSessionPaymentRequest
  ): Promise<{
    completion: ApiResponse<SessionStatusResponse>;
    payment: ApiResponse<PaymentResponse> | null;
  }> {
    const completion = await this.completeSession(appointmentId, completeRequest);

    let payment: ApiResponse<PaymentResponse> | null = null;
    if (paymentRequest && completion.success) {
      payment = await this.processSessionPayment(appointmentId, paymentRequest);
    }

    return { completion, payment };
  },
};

export default sessionService;
