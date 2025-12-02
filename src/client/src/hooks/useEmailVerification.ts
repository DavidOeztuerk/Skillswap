// src/hooks/useEmailVerification.ts
// 🔥 OPTIMIZED: Better effect management, proper typing, stable refs

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useAppSelector } from '../store/store.hooks';
import { useSearchParams } from 'react-router-dom';
import authService from '../api/services/authService';
import { selectAuthUser } from '../store/selectors/authSelectors';
import { isSuccessResponse } from '../types/api/UnifiedResponse';

// ============================================================================
// Constants
// ============================================================================

const SNOOZE_KEY = 'emailVerifySnoozeUntil';
const LAST_PROMPT_KEY = 'emailVerifyLastPrompt';
const MIN_PROMPT_INTERVAL = 60 * 60 * 1000; // 1 hour
const MODAL_DELAY_MS = 3000; // Delay before showing modal

// ============================================================================
// Types
// ============================================================================

/**
 * Extended verification status with optional fields that may come from backend
 */
interface VerificationStatus {
  isVerified: boolean;
  email?: string;
  cooldownUntil?: string;
  lastSentAt?: string;
  attemptsRemaining?: number;
}

interface UseEmailVerificationReturn {
  /** Whether the verification modal is currently open */
  showVerificationModal: boolean;
  /** Whether the current user needs to verify their email */
  needsVerification: boolean;
  /** Verification token from URL (for auto-verify) */
  urlToken: string | null;
  /** Email from URL (for auto-verify) */
  urlEmail: string | null;
  /** Handler for successful verification */
  handleVerificationSuccess: () => void;
  /** Toggle modal open/close */
  toggleVerificationModal: () => void;
  /** Open the modal */
  openVerificationModal: () => void;
  /** Close the modal */
  closeVerificationModal: () => void;
  /** Snooze verification reminder */
  snoozeVerification: (hours?: number) => void;
  /** Clear snooze and cooldown */
  clearSnooze: () => void;
  /** Server verification status */
  verificationStatus: VerificationStatus | null;
  /** Whether modal has been shown this session */
  hasShownThisSession: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if snooze is active
 */
const isSnoozed = (): boolean => {
  const snoozeUntil = localStorage.getItem(SNOOZE_KEY);
  if (!snoozeUntil) return false;
  return new Date() < new Date(snoozeUntil);
};

/**
 * Check if we're in cooldown period between prompts
 */
const isInCooldown = (): boolean => {
  const lastPrompt = localStorage.getItem(LAST_PROMPT_KEY);
  if (!lastPrompt) return false;
  return Date.now() - parseInt(lastPrompt, 10) < MIN_PROMPT_INTERVAL;
};

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for managing email verification state and modal
 */
export const useEmailVerification = (): UseEmailVerificationReturn => {
  // State
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [hasShownThisSession, setHasShownThisSession] = useState(false);
  
  // Router
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Redux
  const user = useAppSelector(selectAuthUser);
  
  // Refs to prevent effect re-runs
  const hasCheckedAutoShowRef = useRef(false);
  const isMountedRef = useRef(true);

  // =========================================================================
  // Derived State
  // =========================================================================
  
  // Check if user needs email verification
  const needsVerification = useMemo(() => {
    return !!(user && !user.emailVerified);
  }, [user]);
  
  // Get URL parameters
  const urlToken = searchParams.get('verificationToken');
  const urlEmail = searchParams.get('email');

  // =========================================================================
  // Fetch Verification Status
  // =========================================================================
  
  useEffect(() => {
    if (!needsVerification) {
      setVerificationStatus(null);
      return;
    }

    // Fetch status from server
    const fetchStatus = async () => {
      try {
        // Check if method exists (optional endpoint)
        if (!authService.getEmailVerificationStatus) {
          return;
        }

        const response = await authService.getEmailVerificationStatus();
        
        // Use type guard to safely extract data
        if (isMountedRef.current && isSuccessResponse(response)) {
          // Map API response to VerificationStatus
          // Backend may return additional fields in the future
          const status: VerificationStatus = {
            isVerified: response.data.isVerified,
            email: response.data.email,
            // These fields might be added by backend later
            cooldownUntil: (response.data as VerificationStatus).cooldownUntil,
            lastSentAt: (response.data as VerificationStatus).lastSentAt,
            attemptsRemaining: (response.data as VerificationStatus).attemptsRemaining,
          };
          setVerificationStatus(status);
        }
      } catch {
        // Silently fail if endpoint doesn't exist or errors
        console.debug('Email verification status fetch failed (endpoint may not exist)');
      }
    };

    fetchStatus();
  }, [needsVerification]);

  // =========================================================================
  // Auto-Open Modal Logic
  // =========================================================================
  
  useEffect(() => {
    // Handle URL token (auto-verify link)
    if (urlToken && urlEmail) {
      setShowVerificationModal(true);
      setHasShownThisSession(true);
      return;
    }

    // Don't auto-show if already checked this session
    if (hasCheckedAutoShowRef.current) return;
    hasCheckedAutoShowRef.current = true;

    // Check conditions for showing modal
    if (!needsVerification) return;
    if (hasShownThisSession) return;
    if (isSnoozed()) return;
    if (isInCooldown()) return;
    
    // Check server cooldown
    if (verificationStatus?.cooldownUntil) {
      if (new Date() < new Date(verificationStatus.cooldownUntil)) {
        return;
      }
    }

    // Show modal after delay for better UX
    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        setShowVerificationModal(true);
        setHasShownThisSession(true);
        localStorage.setItem(LAST_PROMPT_KEY, Date.now().toString());
      }
    }, MODAL_DELAY_MS);

    return () => clearTimeout(timer);
  }, [urlToken, urlEmail, needsVerification, hasShownThisSession, verificationStatus?.cooldownUntil]);

  // =========================================================================
  // Cleanup
  // =========================================================================
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // =========================================================================
  // Handlers (all stable with useCallback)
  // =========================================================================
  
  const handleVerificationSuccess = useCallback(() => {
    setShowVerificationModal(false);

    // Clear URL params if they exist
    const currentToken = searchParams.get('verificationToken');
    const currentEmail = searchParams.get('email');
    
    if (currentToken || currentEmail) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('verificationToken');
      newParams.delete('email');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const toggleVerificationModal = useCallback(() => {
    setShowVerificationModal(prev => !prev);
  }, []);

  const openVerificationModal = useCallback(() => {
    setShowVerificationModal(true);
  }, []);

  const closeVerificationModal = useCallback(() => {
    setShowVerificationModal(false);
  }, []);

  const snoozeVerification = useCallback((hours: number = 24) => {
    const snoozeUntil = new Date();
    snoozeUntil.setHours(snoozeUntil.getHours() + hours);
    localStorage.setItem(SNOOZE_KEY, snoozeUntil.toISOString());
    setShowVerificationModal(false);
    setHasShownThisSession(true);
  }, []);

  const clearSnooze = useCallback(() => {
    localStorage.removeItem(SNOOZE_KEY);
    localStorage.removeItem(LAST_PROMPT_KEY);
    hasCheckedAutoShowRef.current = false; // Allow re-check
  }, []);

  // =========================================================================
  // Return
  // =========================================================================
  
  return {
    showVerificationModal,
    needsVerification,
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

export default useEmailVerification;