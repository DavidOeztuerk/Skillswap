import React, { type ReactNode, memo, useMemo } from 'react';
import EmailVerificationModal from '../components/auth/EmailVerificationModal';
import { useEmailVerification } from '../hooks/useEmailVerification';
import {
  EmailVerificationContext,
  type EmailVerificationContextType,
} from './emailVerificationContextValue';

// ============================================================================
// Provider
// ============================================================================

interface EmailVerificationProviderProps {
  children: ReactNode;
}

/**
 * Provider for Email Verification functionality
 * Manages the email verification modal state globally
 */
export const EmailVerificationProvider: React.FC<EmailVerificationProviderProps> = memo(
  ({ children }) => {
    const {
      showVerificationModal,
      needsVerification,
      urlToken,
      urlEmail,
      handleVerificationSuccess,
      openVerificationModal,
      closeVerificationModal,
      snoozeVerification,
      clearSnooze,
    } = useEmailVerification();

    // =========================================================================
    // Memoized Context Value
    // Only re-creates when actual values change
    // All functions from useEmailVerification are stable (useCallback)
    // =========================================================================
    const value = useMemo<EmailVerificationContextType>(
      () => ({
        showVerificationModal,
        needsVerification,
        openVerificationModal,
        closeVerificationModal,
        snoozeVerification,
        clearSnooze,
      }),
      [
        showVerificationModal,
        needsVerification,
        openVerificationModal,
        closeVerificationModal,
        snoozeVerification,
        clearSnooze,
      ]
    );

    return (
      <EmailVerificationContext.Provider value={value}>
        {children}

        {/* 
        Modal is rendered at provider level to ensure it's always accessible
        and doesn't unmount when navigating between pages 
      */}
        <EmailVerificationModal
          open={showVerificationModal}
          onClose={closeVerificationModal}
          email={urlEmail ?? undefined}
          onVerificationSuccess={handleVerificationSuccess}
          autoVerifyToken={urlToken ?? undefined}
        />
      </EmailVerificationContext.Provider>
    );
  }
);

EmailVerificationProvider.displayName = 'EmailVerificationProvider';
