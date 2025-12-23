import { useState, useCallback, useEffect } from 'react';
import { isSuccessResponse } from '../../../shared/types/api/UnifiedResponse';
import {
  calendarService,
  type CalendarConnectionResponse,
  type CalendarProvider,
} from '../services/calendarService';

export interface CalendarIntegrationState {
  /** List of connected calendars */
  connections: CalendarConnectionResponse[];
  /** Whether we're loading connections */
  isLoading: boolean;
  /** Which provider is currently being connected/disconnected (null if none) */
  connectingProvider: CalendarProvider | null;
  /** Error message if any operation failed */
  error: string | null;
  /** Success message to display (auto-clears after 5 seconds) */
  successMessage: string | null;
}

export interface UseCalendarIntegrationReturn extends CalendarIntegrationState {
  /** Refresh the list of connections */
  refreshConnections: () => Promise<void>;
  /** Connect to a calendar provider (opens OAuth popup/redirect) */
  connectProvider: (provider: CalendarProvider) => Promise<void>;
  /** Connect Apple Calendar using app-specific password */
  connectApple: (appleId: string, appPassword: string) => Promise<boolean>;
  /** Disconnect from a calendar provider */
  disconnectProvider: (provider: CalendarProvider) => Promise<boolean>;
  /** Check if a provider is connected */
  isProviderConnected: (provider: CalendarProvider) => boolean;
  /** Get connection for a specific provider */
  getProviderConnection: (provider: CalendarProvider) => CalendarConnectionResponse | undefined;
  /** Clear any error message */
  clearError: () => void;
  /** Clear any success message */
  clearSuccessMessage: () => void;
  /** Legacy: isConnecting for backward compatibility */
  isConnecting: boolean;
}

/**
 * CALENDAR INTEGRATION HOOK
 *
 * Manages external calendar integrations (Google, Microsoft).
 *
 * Features:
 * - Fetch connected calendars
 * - Connect to Google or Microsoft calendar via OAuth
 * - Disconnect calendar providers
 * - Track connection status
 */
export const useCalendarIntegration = (autoFetch = true): UseCalendarIntegrationReturn => {
  const [state, setState] = useState<CalendarIntegrationState>({
    connections: [],
    isLoading: false,
    connectingProvider: null,
    error: null,
    successMessage: null,
  });

  /**
   * Fetch all calendar connections
   */
  const refreshConnections = useCallback(async (): Promise<void> => {
    console.debug('[CalendarIntegration] refreshConnections called');
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await calendarService.getConnections();
      console.debug('[CalendarIntegration] getConnections response:', response);

      if (isSuccessResponse(response)) {
        console.debug('[CalendarIntegration] Connections loaded:', response.data);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          connections: response.data,
        }));
      } else {
        console.error('[CalendarIntegration] Failed to load connections:', response.message);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: response.message ?? 'Failed to fetch calendar connections',
        }));
      }
    } catch (error) {
      console.error('[CalendarIntegration] Error loading connections:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch calendar connections',
      }));
    }
  }, []);

  /**
   * Connect to a calendar provider (OAuth flow)
   * This will redirect the user to the OAuth provider's login page
   */
  const connectProvider = useCallback(async (provider: CalendarProvider): Promise<void> => {
    // Don't allow connecting Apple via OAuth - use connectApple instead
    if (provider === 'apple') {
      setState((prev) => ({
        ...prev,
        error:
          'Apple Kalender benötigt App-spezifisches Passwort. Bitte verwende den Apple-Dialog.',
      }));
      return;
    }

    setState((prev) => ({ ...prev, connectingProvider: provider, error: null }));

    // Set a timeout to reset state if redirect doesn't happen
    const timeoutId = setTimeout(() => {
      setState((prev) => {
        if (prev.connectingProvider === provider) {
          return {
            ...prev,
            connectingProvider: null,
            error: 'Verbindung fehlgeschlagen. Bitte versuche es erneut.',
          };
        }
        return prev;
      });
    }, 10000);

    try {
      // Build redirect URI - after OAuth, the backend redirects back to our app
      const currentUrl = window.location.origin;
      const callbackUrl = `${currentUrl}/settings/notifications?calendarCallback=true`;

      const response = await calendarService.initiateConnect(provider, callbackUrl);

      if (isSuccessResponse(response)) {
        const { authorizationUrl, state: oauthState } = response.data;
        if (authorizationUrl) {
          // Redirect to OAuth provider
          // Store state in sessionStorage for verification after callback
          sessionStorage.setItem('calendarOAuthState', oauthState);
          sessionStorage.setItem('calendarOAuthProvider', provider);

          // Redirect to authorization URL - timeout will clear if page navigates away
          // eslint-disable-next-line require-atomic-updates
          window.location.href = authorizationUrl;
          return;
        }
      }

      clearTimeout(timeoutId);
      setState((prev) => ({
        ...prev,
        connectingProvider: null,
        error:
          !isSuccessResponse(response) && response.message
            ? response.message
            : 'Failed to initiate calendar connection',
      }));
    } catch (error) {
      clearTimeout(timeoutId);
      setState((prev) => ({
        ...prev,
        connectingProvider: null,
        error: error instanceof Error ? error.message : 'Failed to connect calendar',
      }));
    }
  }, []);

  /**
   * Show success message with auto-clear after 5 seconds
   */
  const showSuccess = useCallback((message: string): void => {
    setState((prev) => ({ ...prev, successMessage: message }));
    setTimeout(() => {
      setState((prev) => ({ ...prev, successMessage: null }));
    }, 5000);
  }, []);

  /**
   * Connect Apple Calendar using app-specific password
   * @param appleId - The user's Apple ID (email)
   * @param appPassword - App-specific password from Apple ID settings
   * @returns true if connection was successful
   */
  const connectApple = useCallback(
    async (appleId: string, appPassword: string): Promise<boolean> => {
      console.debug('[CalendarIntegration] connectApple called with appleId:', appleId);
      setState((prev) => ({ ...prev, connectingProvider: 'apple', error: null }));

      try {
        const response = await calendarService.connectApple(appleId, appPassword);
        console.debug('[CalendarIntegration] connectApple response:', response);

        if (isSuccessResponse(response)) {
          console.debug(
            '[CalendarIntegration] Apple connection successful, adding to state:',
            response.data
          );
          // Add the new connection to state
          setState((prev) => {
            const newState = {
              ...prev,
              connectingProvider: null,
              connections: [...prev.connections, response.data],
            };
            console.debug('[CalendarIntegration] New connections state:', newState.connections);
            return newState;
          });
          showSuccess('Apple iCloud Kalender erfolgreich verbunden!');
          return true;
        }

        console.error('[CalendarIntegration] Apple connection failed:', response.message);
        setState((prev) => ({
          ...prev,
          connectingProvider: null,
          error: response.message ?? 'Apple Kalender-Verbindung fehlgeschlagen',
        }));
        return false;
      } catch (error) {
        console.error('[CalendarIntegration] Apple connection error:', error);
        setState((prev) => ({
          ...prev,
          connectingProvider: null,
          error:
            error instanceof Error ? error.message : 'Apple Kalender-Verbindung fehlgeschlagen',
        }));
        return false;
      }
    },
    [showSuccess]
  );

  /**
   * Disconnect from a calendar provider
   */
  const disconnectProvider = useCallback(
    async (provider: CalendarProvider): Promise<boolean> => {
      setState((prev) => ({ ...prev, connectingProvider: provider, error: null }));

      const providerNames: Record<string, string> = {
        google: 'Google Kalender',
        microsoft: 'Microsoft Outlook',
        apple: 'Apple iCloud Kalender',
      };

      try {
        const response = await calendarService.disconnect(provider);

        if (isSuccessResponse(response)) {
          // Remove from local state
          setState((prev) => ({
            ...prev,
            connectingProvider: null,
            connections: prev.connections.filter((c) => c.provider.toLowerCase() !== provider),
          }));
          showSuccess(`${providerNames[provider] ?? 'Kalender'} wurde getrennt.`);
          return true;
        }
        setState((prev) => ({
          ...prev,
          connectingProvider: null,
          error: response.message ?? 'Kalender konnte nicht getrennt werden',
        }));
        return false;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          connectingProvider: null,
          error: error instanceof Error ? error.message : 'Kalender konnte nicht getrennt werden',
        }));
        return false;
      }
    },
    [showSuccess]
  );

  /**
   * Check if a provider is connected
   */
  const isProviderConnected = useCallback(
    (provider: CalendarProvider): boolean =>
      calendarService.isProviderConnected(state.connections, provider),
    [state.connections]
  );

  /**
   * Get connection for a specific provider
   */
  const getProviderConnection = useCallback(
    (provider: CalendarProvider): CalendarConnectionResponse | undefined =>
      calendarService.getProviderConnection(state.connections, provider),
    [state.connections]
  );

  /**
   * Clear error
   */
  const clearError = useCallback((): void => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  /**
   * Clear success message
   */
  const clearSuccessMessage = useCallback((): void => {
    setState((prev) => ({ ...prev, successMessage: null }));
  }, []);

  // Auto-fetch connections on mount
  useEffect(() => {
    const fetchOnMount = async (): Promise<void> => {
      if (autoFetch) {
        await refreshConnections();
      }
    };
    fetchOnMount().catch(() => {});
  }, [autoFetch, refreshConnections]);

  // Handle OAuth callback (check for callback URL params)
  useEffect(() => {
    const handleOAuthCallback = async (): Promise<void> => {
      const urlParams = new URLSearchParams(window.location.search);
      const isCallback = urlParams.get('calendarCallback') === 'true';
      const callbackError = urlParams.get('error');

      if (isCallback) {
        // Get provider from session storage for success message
        const provider = sessionStorage.getItem('calendarOAuthProvider');
        const providerNames: Record<string, string> = {
          google: 'Google Kalender',
          microsoft: 'Microsoft Outlook',
          apple: 'Apple iCloud Kalender',
        };

        // Clean up URL
        const url = new URL(window.location.href);
        url.searchParams.delete('calendarCallback');
        url.searchParams.delete('error');
        window.history.replaceState({}, '', url.toString());

        // Clear stored OAuth state
        sessionStorage.removeItem('calendarOAuthState');
        sessionStorage.removeItem('calendarOAuthProvider');

        if (callbackError) {
          // OAuth failed
          setState((prev) => ({
            ...prev,
            error: `Verbindung fehlgeschlagen: ${callbackError}`,
          }));
        } else {
          // OAuth succeeded - show success and refresh
          const providerName = provider ? (providerNames[provider] ?? provider) : 'Kalender';
          showSuccess(`${providerName} erfolgreich verbunden!`);
          await refreshConnections();
        }
      }
    };
    handleOAuthCallback().catch(() => {});
  }, [refreshConnections, showSuccess]);

  return {
    // State
    ...state,

    // Backward compatibility: isConnecting is true if any provider is connecting
    isConnecting: state.connectingProvider !== null,

    // Actions
    refreshConnections,
    connectProvider,
    connectApple,
    disconnectProvider,
    isProviderConnected,
    getProviderConnection,
    clearError,
    clearSuccessMessage,
  };
};

export default useCalendarIntegration;
