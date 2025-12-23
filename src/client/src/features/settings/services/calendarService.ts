import { apiClient } from '../../../core/api/apiClient';
import { CALENDAR_ENDPOINTS } from '../../../core/config/endpoints';
import type { ApiResponse } from '../../../shared/types/api/UnifiedResponse';

/**
 * Calendar provider types
 */
export type CalendarProvider = 'google' | 'microsoft' | 'apple';

/**
 * Auth type for calendar providers
 */
export type CalendarAuthType = 'oauth' | 'password';

/**
 * Calendar connection response
 */
export interface CalendarConnectionResponse {
  id: string;
  provider: string;
  providerEmail?: string;
  calendarId?: string;
  syncEnabled: boolean;
  lastSyncAt?: string;
  syncCount: number;
  lastSyncError?: string;
  isTokenExpired: boolean;
  createdAt: string;
}

/**
 * Initiate calendar connect response
 */
export interface InitiateCalendarConnectResponse {
  authorizationUrl: string;
  state: string;
}

/**
 * Calendar service for managing external calendar integrations
 */
export const calendarService = {
  /**
   * Get all connected calendars for the current user
   */
  async getConnections(): Promise<ApiResponse<CalendarConnectionResponse[]>> {
    return apiClient.get<CalendarConnectionResponse[]>(CALENDAR_ENDPOINTS.CONNECTIONS);
  },

  /**
   * Initiate OAuth connection with a calendar provider
   * @param provider - The calendar provider (google or microsoft)
   * @param redirectUri - Optional custom redirect URI for OAuth callback
   * @returns The authorization URL to redirect the user to
   */
  async initiateConnect(
    provider: CalendarProvider,
    redirectUri?: string
  ): Promise<ApiResponse<InitiateCalendarConnectResponse>> {
    const queryString = redirectUri ? `?redirectUri=${encodeURIComponent(redirectUri)}` : '';
    const url = `${CALENDAR_ENDPOINTS.CONNECT}/${provider}${queryString}`;
    return apiClient.post<InitiateCalendarConnectResponse>(url, {});
  },

  /**
   * Disconnect a calendar provider
   * @param provider - The calendar provider to disconnect
   */
  async disconnect(provider: CalendarProvider): Promise<ApiResponse<boolean>> {
    return apiClient.delete<boolean>(`${CALENDAR_ENDPOINTS.DISCONNECT}/${provider}`);
  },

  /**
   * Connect Apple Calendar using App-specific password (CalDAV)
   * @param appleId - The user's Apple ID (email)
   * @param appPassword - App-specific password from Apple ID settings
   * @returns Success/failure response
   */
  async connectApple(
    appleId: string,
    appPassword: string
  ): Promise<ApiResponse<CalendarConnectionResponse>> {
    // Backend expects base64-encoded credentials in format appleId:appPassword
    const credentials = btoa(`${appleId}:${appPassword}`);
    return apiClient.post<CalendarConnectionResponse>(`${CALENDAR_ENDPOINTS.CONNECT}/apple`, {
      credentials,
    });
  },

  /**
   * Check if a specific provider is connected
   * @param connections - List of calendar connections
   * @param provider - The provider to check
   */
  isProviderConnected(
    connections: CalendarConnectionResponse[],
    provider: CalendarProvider
  ): boolean {
    return connections.some((c) => c.provider.toLowerCase() === provider && !c.isTokenExpired);
  },

  /**
   * Get connection for a specific provider
   * @param connections - List of calendar connections
   * @param provider - The provider to get
   */
  getProviderConnection(
    connections: CalendarConnectionResponse[],
    provider: CalendarProvider
  ): CalendarConnectionResponse | undefined {
    return connections.find((c) => c.provider.toLowerCase() === provider);
  },
};

export default calendarService;
