import {
  getRefreshToken,
  getTimeUntilExpiration,
  getToken,
  isTokenExpired,
  removeToken,
  setRefreshToken,
  setToken,
} from '../../shared/utils/authHelpers';
import { refreshLock } from '../../shared/utils/refreshLock';
import { API_BASE_URL, AUTH_ENDPOINTS } from '../config/endpoints';

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

  private scheduleNextRefresh(_silent = false): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    this.refreshTimer = null;

    const token = getToken();
    if (!token) return;

    if (isTokenExpired(token)) {
      void this.refreshToken();
      return;
    }

    const timeUntilExpiry = getTimeUntilExpiration(token);
    if (timeUntilExpiry === null) return;

    const refreshIn = Math.max(timeUntilExpiry - this.REFRESH_BUFFER, this.MIN_REFRESH_INTERVAL);
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
            return res.statusText || `HTTP ${res.status}`;
          } catch {
            return `HTTP ${res.status}`;
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
      // eslint-disable-next-line require-atomic-updates -- Intentional: refreshLock is used as a mutex flag to prevent concurrent refresh attempts
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
    if (tte !== null && tte < 5 * 60 * 1000) {
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
    const tte = token === null ? null : getTimeUntilExpiration(token);
    const nextRefreshIn = tte === null ? null : Math.max(tte - this.REFRESH_BUFFER, 0);
    return {
      isRunning: this.refreshTimer !== null,
      isRefreshing: refreshLock.active,
      nextRefreshIn,
    };
  }
}

const tokenRefreshService = new TokenRefreshService();

export default tokenRefreshService;
