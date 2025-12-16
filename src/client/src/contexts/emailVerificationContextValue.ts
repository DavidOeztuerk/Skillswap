import { createContext } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface EmailVerificationContextType {
  /** Whether the verification modal is currently open */
  showVerificationModal: boolean;
  /** Whether the current user needs to verify their email */
  needsVerification: boolean;
  /** Open the verification modal */
  openVerificationModal: () => void;
  /** Close the verification modal */
  closeVerificationModal: () => void;
  /** Snooze verification reminder for specified hours (default: 24) */
  snoozeVerification: (hours?: number) => void;
  /** Clear snooze to re-enable prompts */
  clearSnooze: () => void;
}

// ============================================================================
// Context
// ============================================================================

export const EmailVerificationContext = createContext<EmailVerificationContextType | undefined>(
  undefined
);

export default EmailVerificationContext;
