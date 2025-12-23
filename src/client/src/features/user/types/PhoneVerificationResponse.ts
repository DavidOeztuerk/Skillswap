/**
 * API response for phone verification operations
 */
export interface PhoneVerificationResponse {
  success: boolean;
  message: string;
  cooldownUntil?: string | null;
  attemptsRemaining: number;
  expiresAt?: string | null;
  maskedPhoneNumber?: string | null;
  apiVersion: string;
}
