import { useState, useCallback, useEffect } from 'react';
import { useAppSelector } from '../store/store.hooks';
import { useSearchParams } from 'react-router-dom';
import authService from '../api/services/authService';
import { selectAuthUser } from '../store/selectors/authSelectors';

const SNOOZE_KEY = 'emailVerifySnoozeUntil';
const LAST_PROMPT_KEY = 'emailVerifyLastPrompt';
const MIN_PROMPT_INTERVAL = 60 * 60 * 1000;

/**
 * Hook for managing email verification state and modal
 */
export const useEmailVerification = () => {
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [hasShownThisSession, setHasShownThisSession] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAppSelector(selectAuthUser);
  
  // Check if user needs email verification
  const needsVerification = user && !user.emailVerified;
  
  // Check for verification token in URL
  const urlToken = searchParams.get('verificationToken');
  const urlEmail = searchParams.get('email');
  
  // Check if modal should be shown based on snooze and cooldown
  const shouldShowModal = useCallback(() => {
    if (!needsVerification) return false;
    if (hasShownThisSession) return false;
    
    // Check localStorage snooze
    const snoozeUntil = localStorage.getItem(SNOOZE_KEY);
    if (snoozeUntil && new Date() < new Date(snoozeUntil)) {
      return false;
    }
    
    // Check last prompt time
    const lastPrompt = localStorage.getItem(LAST_PROMPT_KEY);
    if (lastPrompt && Date.now() - parseInt(lastPrompt) < MIN_PROMPT_INTERVAL) {
      return false;
    }
    
    // Check server cooldown
    if (verificationStatus?.cooldownUntil && new Date() < new Date(verificationStatus.cooldownUntil)) {
      return false;
    }
    
    return true;
  }, [needsVerification, hasShownThisSession, verificationStatus]);
  
  // Fetch verification status from server
  useEffect(() => {
    if (needsVerification) {
      authService.getEmailVerificationStatus?.()
        .then(status => setVerificationStatus(status))
        .catch(() => {}); // Silently fail if endpoint doesn't exist yet
    }
  }, [needsVerification]);
  
  // Auto-open modal if token is in URL
  useEffect(() => {
    if (urlToken && urlEmail) {
      setShowVerificationModal(true);
      setHasShownThisSession(true);
    }
  }, [urlToken, urlEmail]);
  
  // Show modal if conditions are met
  useEffect(() => {
    if (shouldShowModal()) {
      // Delay showing modal to avoid jarring UX
      const timer = setTimeout(() => {
        setShowVerificationModal(true);
        setHasShownThisSession(true);
        localStorage.setItem(LAST_PROMPT_KEY, Date.now().toString());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [shouldShowModal]);
  
  // Handle verification success
  const handleVerificationSuccess = useCallback(() => {
    setShowVerificationModal(false);
    
    // Clear URL params if they exist
    if (urlToken || urlEmail) {
      searchParams.delete('verificationToken');
      searchParams.delete('email');
      setSearchParams(searchParams);
    }
  }, [urlToken, urlEmail, searchParams, setSearchParams]);
  
  // Toggle modal visibility
  const toggleVerificationModal = useCallback(() => {
    setShowVerificationModal((prev) => !prev);
  }, []);
  
  // Open modal manually
  const openVerificationModal = useCallback(() => {
    setShowVerificationModal(true);
  }, []);
  
  // Close modal
  const closeVerificationModal = useCallback(() => {
    setShowVerificationModal(false);
  }, []);
  
  // Snooze verification for specified hours
  const snoozeVerification = useCallback((hours: number = 24) => {
    const snoozeUntil = new Date();
    snoozeUntil.setHours(snoozeUntil.getHours() + hours);
    localStorage.setItem(SNOOZE_KEY, snoozeUntil.toISOString());
    setShowVerificationModal(false);
    setHasShownThisSession(true);
  }, []);
  
  // Clear snooze
  const clearSnooze = useCallback(() => {
    localStorage.removeItem(SNOOZE_KEY);
    localStorage.removeItem(LAST_PROMPT_KEY);
  }, []);
  
  return {
    showVerificationModal,
    needsVerification: needsVerification || false,
    urlToken,
    urlEmail,
    handleVerificationSuccess,
    toggleVerificationModal,
    openVerificationModal,
    closeVerificationModal,
    snoozeVerification,
    clearSnooze,
    verificationStatus,
    hasShownThisSession,
  };
};