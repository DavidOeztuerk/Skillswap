import { useContext } from 'react';
import {
  EmailVerificationContext,
  type EmailVerificationContextType,
} from './emailVerificationContextValue';

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
