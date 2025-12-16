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
 * 🚀 EMAIL VERIFICATION HOOK
 *
 * ✅ Manages email verification modal state
 * ✅ Auto-shows modal based on user verification status
 * ✅ Handles URL token verification
 * ✅ Memoized Actions - prevents unnecessary re-renders
 *
 * NOTE: This hook uses local state (not Redux) for modal management,
 * but follows the useAdmin pattern for action organization.
 */
export const useEmailVerification = (): {
  // === STATE ===
  showVerificationModal: boolean;
  needsVerification: boolean;
  urlToken: string | null;
  urlEmail: string | null;
  verificationStatus: VerificationStatus | null;
  hasShownThisSession: boolean;
  // === ACTIONS ===
  handleVerificationSuccess: () => void;
  toggleVerificationModal: () => void;
  openVerificationModal: () => void;
  closeVerificationModal: () => void;
  snoozeVerification: (hours?: number) => void;
  clearSnooze: () => void;
} => {
  // =========================================================================
  // Local State
  // =========================================================================

  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [hasShownThisSession, setHasShownThisSession] = useState(false);

  // =========================================================================
  // Router
  // =========================================================================

  const [searchParams, setSearchParams] = useSearchParams();

  // =========================================================================
  // Redux Selectors
  // =========================================================================

  const user = useAppSelector(selectAuthUser);

  // =========================================================================
  // Refs
  // =========================================================================

  const hasCheckedAutoShowRef = useRef(false);
  const isMountedRef = useRef(true);

  // =========================================================================
  // Derived State
  // =========================================================================

  const needsVerification = useMemo(() => !!(user && !user.emailVerified), [user]);
  const urlToken = searchParams.get('verificationToken');
  const urlEmail = searchParams.get('email');

  // =========================================================================
  // Effects - Fetch Verification Status
  // =========================================================================

  useEffect(() => {
    if (!needsVerification) {
      return;
    }

    authService
      .getEmailVerificationStatus()
      .then((response) => {
        if (isMountedRef.current && isSuccessResponse(response)) {
          const status: VerificationStatus = {
            isVerified: response.data.isVerified,
            email: response.data.email,
            cooldownUntil: (response.data as VerificationStatus).cooldownUntil,
            lastSentAt: (response.data as VerificationStatus).lastSentAt,
            attemptsRemaining: (response.data as VerificationStatus).attemptsRemaining,
          };
          setVerificationStatus(status);
        }
      })
      .catch(() => {
        console.debug('Email verification status fetch failed (endpoint may not exist)');
      });
  }, [needsVerification]);

  // =========================================================================
  // Effects - URL Token Handler
  // =========================================================================

  useEffect(() => {
    if (urlToken && urlEmail) {
      const timer = setTimeout(() => {
        setShowVerificationModal(true);
        setHasShownThisSession(true);
      }, 0);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [urlToken, urlEmail]);

  // =========================================================================
  // Effects - Auto-show Modal
  // =========================================================================

  useEffect(() => {
    if (hasCheckedAutoShowRef.current) return;
    hasCheckedAutoShowRef.current = true;

    if (!needsVerification) return;
    if (hasShownThisSession) return;
    if (isSnoozed()) return;
    if (isInCooldown()) return;

    if (verificationStatus?.cooldownUntil) {
      if (new Date() < new Date(verificationStatus.cooldownUntil)) {
        return;
      }
    }

    const timer = setTimeout(() => {
      if (isMountedRef.current) {
        setShowVerificationModal(true);
        setHasShownThisSession(true);
        localStorage.setItem(LAST_PROMPT_KEY, Date.now().toString());
      }
    }, MODAL_DELAY_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [needsVerification, hasShownThisSession, verificationStatus?.cooldownUntil]);

  // =========================================================================
  // Effects - Cleanup
  // =========================================================================

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // =========================================================================
  // Memoized Actions
  // =========================================================================

  const actions = useMemo(
    () => ({
      toggleVerificationModal: () => {
        setShowVerificationModal((prev) => !prev);
      },

      openVerificationModal: () => {
        setShowVerificationModal(true);
      },

      closeVerificationModal: () => {
        setShowVerificationModal(false);
      },

      snoozeVerification: (hours = 24) => {
        const snoozeUntil = new Date();
        snoozeUntil.setHours(snoozeUntil.getHours() + hours);
        localStorage.setItem(SNOOZE_KEY, snoozeUntil.toISOString());
        setShowVerificationModal(false);
        setHasShownThisSession(true);
      },

      clearSnooze: () => {
        localStorage.removeItem(SNOOZE_KEY);
        localStorage.removeItem(LAST_PROMPT_KEY);
        hasCheckedAutoShowRef.current = false;
      },
    }),
    []
  );

  // Handler with dependencies (needs useCallback)
  const handleVerificationSuccess = useCallback(() => {
    setShowVerificationModal(false);

    const currentToken = searchParams.get('verificationToken');
    const currentEmail = searchParams.get('email');

    if (currentToken || currentEmail) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('verificationToken');
      newParams.delete('email');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // =========================================================================
  // Return
  // =========================================================================

  return {
    // === STATE ===
    showVerificationModal,
    needsVerification,
    urlToken,
    urlEmail,
    verificationStatus,
    hasShownThisSession,

    // === ACTIONS ===
    handleVerificationSuccess,
    ...actions,
  };
};

export default useEmailVerification;
