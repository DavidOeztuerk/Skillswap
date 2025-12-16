import { API_BASE_URL, AUTH_ENDPOINTS } from '../config/endpoints';
import {
  getToken,
  getRefreshToken,
  getTimeUntilExpiration,
  isTokenExpired,
  setToken,
  setRefreshToken,
  removeToken,
} from '../utils/authHelpers';
import { refreshLock } from '../utils/refreshLock';

class TokenRefreshService {
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly REFRESH_BUFFER = 2 * 60 * 1000;
  private readonly MIN_REFRESH_INTERVAL = 30 * 1000;

  public start(): void {
    this.scheduleNextRefresh();
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.addEventListener('focus', this.handleWindowFocus);
  }

  public stop(): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    this.refreshTimer = null;
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('focus', this.handleWindowFocus);
  }

  private scheduleNextRefresh(silent = false): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    this.refreshTimer = null;

    const token = getToken();
    console.debug('🔍 [TokenRefreshService] scheduleNextRefresh called');
    console.debug('🔍 [TokenRefreshService] Has token:', !!token);

    if (!token) {
      console.debug('🔍 [TokenRefreshService] No token found, exiting');
      return;
    }

    const expired = isTokenExpired(token);
    console.debug('🔍 [TokenRefreshService] Is token expired?', expired);

    if (expired) {
      console.debug('⚠️ [TokenRefreshService] Token is EXPIRED, refreshing immediately!');
      void this.refreshToken();
      return;
    }

    const timeUntilExpiry = getTimeUntilExpiration(token);
    console.debug('🔍 [TokenRefreshService] Time until expiry (ms):', timeUntilExpiry);
    console.debug(
      '🔍 [TokenRefreshService] Time until expiry (minutes):',
      timeUntilExpiry !== null ? String(Math.round(timeUntilExpiry / 60000)) : null
    );

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (timeUntilExpiry === null || timeUntilExpiry === undefined) {
      console.debug('🔍 [TokenRefreshService] No time until expiry, exiting');
      return;
    }

    const refreshIn = Math.max(timeUntilExpiry - this.REFRESH_BUFFER, this.MIN_REFRESH_INTERVAL);
    console.debug('🔍 [TokenRefreshService] Will refresh in (ms):', refreshIn);
    console.debug(
      '🔍 [TokenRefreshService] Will refresh in (minutes):',
      String(Math.round(refreshIn / 60000))
    );

    if (!silent) console.debug(`⏱️ next refresh in ${String(Math.round(refreshIn / 1000))}s`);
    this.refreshTimer = setTimeout(() => {
      void this.refreshToken();
    }, refreshIn);
  }

  private async refreshToken(): Promise<void> {
    if (refreshLock.active) return; // Axios-Refresh läuft bereits
    refreshLock.active = true;

    try {
      const accessToken = getToken() ?? '';
      const rt = getRefreshToken();
      if (!rt) throw new Error('No refresh token available');

      const res = await fetch(`${API_BASE_URL}${AUTH_ENDPOINTS.REFRESH_TOKEN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ accessToken, refreshToken: rt }),
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          removeToken();
          window.location.href = '/auth/login';
        }
        const msg = (() => {
          try {
            return res.statusText || `HTTP ${String(res.status)}`;
          } catch {
            return `HTTP ${String(res.status)}`;
          }
        })();
        throw new Error(`Refresh failed: ${msg}`);
      }

      const data = (await res.json().catch(() => ({}))) as {
        data?: { accessToken?: string; refreshToken?: string };
        accessToken?: string;
        refreshToken?: string;
      };
      const payload = data.data ?? data;
      const newAt: string | undefined = payload.accessToken;
      const newRt: string | undefined = payload.refreshToken;

      if (newAt === undefined) throw new Error('Invalid refresh response (no accessToken)');

      const storageType = localStorage.getItem('remember_me') === 'true' ? 'permanent' : 'session';
      setToken(newAt, storageType);
      if (newRt !== undefined) setRefreshToken(newRt, storageType);

      this.scheduleNextRefresh();
    } catch (e) {
      console.error('Token refresh error', e);
      // retry nur wenn noch eingeloggt
      if (getToken() !== null) {
        this.refreshTimer = setTimeout(() => {
          void this.refreshToken();
        }, 30_000);
      }
    } finally {
      refreshLock.active = false;
    }
  }

  private handleVisibilityChange = (): void => {
    if (!document.hidden) this.checkAndRefresh();
  };

  private handleWindowFocus = (): void => {
    this.checkAndRefresh();
  };

  private checkAndRefresh(): void {
    const token = getToken();
    if (token === null) return;

    const tte = getTimeUntilExpiration(token);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (tte !== null && tte !== undefined && tte < 5 * 60 * 1000) {
      void this.refreshToken();
    } else {
      this.scheduleNextRefresh(true);
    }
  }

  public async forceRefresh(): Promise<void> {
    await this.refreshToken();
  }

  public getStatus(): { isRunning: boolean; isRefreshing: boolean; nextRefreshIn: number | null } {
    const token = getToken();
    const tte = token !== null ? getTimeUntilExpiration(token) : null;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const nextRefreshIn =
      tte !== null && tte !== undefined ? Math.max(tte - this.REFRESH_BUFFER, 0) : null;
    return {
      isRunning: this.refreshTimer !== null,
      isRefreshing: refreshLock.active,
      nextRefreshIn,
    };
  }
}

const tokenRefreshService = new TokenRefreshService();

export default tokenRefreshService;
