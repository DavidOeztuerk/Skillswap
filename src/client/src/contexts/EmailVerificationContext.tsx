import React, { createContext, useContext, ReactNode, memo } from 'react';
import EmailVerificationModal from '../components/auth/EmailVerificationModal';
import { useEmailVerification } from '../hooks/useEmailVerification';

interface EmailVerificationContextType {
  showVerificationModal: boolean;
  needsVerification: boolean;
  openVerificationModal: () => void;
  closeVerificationModal: () => void;
  snoozeVerification: (hours?: number) => void;
}

const EmailVerificationContext = createContext<EmailVerificationContextType | undefined>(undefined);

/**
 * Provider for Email Verification functionality
 * Manages the email verification modal state globally
 */
export const EmailVerificationProvider: React.FC<{ children: ReactNode }> = memo(({ children }) => {
  const {
    showVerificationModal,
    needsVerification,
    urlToken,
    urlEmail,
    handleVerificationSuccess,
    openVerificationModal,
    closeVerificationModal,
    snoozeVerification,
  } = useEmailVerification();

  // REMOVED PROBLEMATIC useMemo - was causing infinite re-renders!
  const value = {
    showVerificationModal,
    needsVerification: needsVerification || false,
    openVerificationModal,
    closeVerificationModal,
    snoozeVerification,
  };
  
  return (
    <EmailVerificationContext.Provider value={value}>
      {children}
      <EmailVerificationModal
        open={showVerificationModal}
        onClose={closeVerificationModal}
        email={urlEmail || undefined}
        onVerificationSuccess={handleVerificationSuccess}
        autoVerifyToken={urlToken || undefined}
      />
    </EmailVerificationContext.Provider>
  );
});

EmailVerificationProvider.displayName = 'EmailVerificationProvider';

/**
 * Hook to use Email Verification context
 */
export const useEmailVerificationContext = () => {
  const context = useContext(EmailVerificationContext);
  if (!context) {
    throw new Error('useEmailVerificationContext must be used within EmailVerificationProvider');
  }
  return context;
};