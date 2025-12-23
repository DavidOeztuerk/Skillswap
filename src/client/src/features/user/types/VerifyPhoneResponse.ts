/**
 * API response for verify phone operation
 */
export interface VerifyPhoneResponse {
  success: boolean;
  message: string;
  phoneVerified: boolean;
  phoneNumber?: string | null;
  apiVersion: string;
}
