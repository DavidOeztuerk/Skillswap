import React, { createContext, useContext, ReactNode, memo, useMemo } from 'react';
import EmailVerificationModal from '../components/auth/EmailVerificationModal';
import { useEmailVerification } from '../hooks/useEmailVerification';

// ============================================================================
// Types
// ============================================================================

interface EmailVerificationContextType {
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

const EmailVerificationContext = createContext<EmailVerificationContextType | undefined>(undefined);

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
export const EmailVerificationProvider: React.FC<EmailVerificationProviderProps> = memo(({ children }) => {
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
  const value = useMemo<EmailVerificationContextType>(() => ({
    showVerificationModal,
    needsVerification,
    openVerificationModal,
    closeVerificationModal,
    snoozeVerification,
    clearSnooze,
  }), [
    showVerificationModal,
    needsVerification,
    openVerificationModal,
    closeVerificationModal,
    snoozeVerification,
    clearSnooze,
  ]);

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
});

EmailVerificationProvider.displayName = 'EmailVerificationProvider';

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access Email Verification context
 * @throws Error if used outside of EmailVerificationProvider
 */
export const useEmailVerificationContext = (): EmailVerificationContextType => {
  const context = useContext(EmailVerificationContext);
  
  if (!context) {
    throw new Error(
      'useEmailVerificationContext must be used within an EmailVerificationProvider. ' +
      'Make sure your component is wrapped in <EmailVerificationProvider>.'
    );
  }
  
  return context;
};

// ============================================================================
// Export
// ============================================================================

export default EmailVerificationContext;