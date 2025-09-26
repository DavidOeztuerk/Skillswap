import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
  HubConnectionState,
} from '@microsoft/signalr';
import { store } from '../../store/store';
import {
  addNotification,
  setConnectionStatus,
  setConnectionId,
  setUnreadCount,
  setNotifications,
} from '../../features/notifications/notificationSlice';
import type { Notification as ClientNotification } from '../../types/models/Notification';
import { toast } from 'react-toastify';

/**
 * Robustes Mapping: serverseitige Felder -> Client-Model
 */
function mapToClientNotification(n: any): ClientNotification {
  return {
    id: n.id ?? n.Id,
    userId: n.userId,
    type: n.tyoe,
    title: n.title ?? n.Subject ?? n.Title ?? 'Notification',
    message: n.message ?? n.Content ?? n.Message ?? '',
    isRead: (n.isRead ?? n.IsRead ?? false) as boolean,
    createdAt: n.createdAt ?? n.CreatedAt ?? new Date().toISOString(),
    readAt: n.readAt ?? n.ReadAt ?? null,
    actionUrl: n.actionUrl ?? n.ActionUrl ?? null,
    metadata: n.metadata ?? n.Metadata ?? n.metadataJson ?? n.MetadataJson ?? null,
  };
}

class NotificationHubService {
  private connection: HubConnection | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 5000;
  private isIntentionalDisconnect = false;

  /**
   * Verbinde zum Hub
   */
  public async connect(userId: string): Promise<void> {
    if (this.connection?.state === HubConnectionState.Connected) {
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.warn('NotificationHub: No authentication token found, skipping connection');
      return; // Return gracefully instead of throwing error
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    const hubUrl = `${baseUrl}/notification-service/hubs/notifications`;

    this.connection = new HubConnectionBuilder()
      .withUrl(hubUrl, { accessTokenFactory: () => token })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (ctx) => {
          if (ctx.previousRetryCount >= this.maxReconnectAttempts) return null;
          return Math.min(1000 * Math.pow(2, ctx.previousRetryCount), 30000);
        },
      })
      .configureLogging(LogLevel.Information)
      .build();

    this.setupEventHandlers();

    try {
      await this.connection.start();
      store.dispatch(setConnectionStatus(true));
      store.dispatch(setConnectionId(this.connection.connectionId ?? null));
      this.reconnectAttempts = 0;

      // direkt nach Connect die letzten Notifications holen
      await this.getRecentNotifications();
    } catch (err) {
      console.error('NotificationHub connect failed:', err);
      store.dispatch(setConnectionStatus(false));
      this.scheduleReconnect(userId);
      throw err;
    }
  }

  /**
   * Event-Handler registrieren
   */
  private setupEventHandlers(): void {
    if (!this.connection) return;

    // Neue Notification
    this.connection.on('NewNotification', (payload: Record<string, unknown>) => {
      const n = mapToClientNotification(payload);
      store.dispatch(addNotification(n));
      this.showToast(n);
    });

    // Einzelne Notification gelesen
    this.connection.on('NotificationRead', (_notificationId: string) => {
      // Optional: UI-Feedback, Store-Update übernimmt dein Slice via Thunks
      // (wir lassen das hier bewusst schlank)
    });

    // Alle gelesen
    this.connection.on('AllNotificationsRead', () => {
      // UnreadCount kommt separat – hier kein Store-Reset nötig
    });

    // Unread Count
    this.connection.on('UnreadCount', (count: number) => {
      store.dispatch(setUnreadCount(count));
    });

    // Kürzlich (Liste)
    this.connection.on('RecentNotifications', (list: Record<string, unknown>[]) => {
      const mapped = (list ?? []).map(mapToClientNotification);
      // Wir überschreiben hier bewusst die Liste – dein Slice hat setNotifications
      store.dispatch(setNotifications(mapped));
      // Unread neu berechnen übernimmt dein Slice beim nächsten fetch; hier lassen wir den Count
      // vom Server-Event "UnreadCount" bestimmen.
    });

    // Fehler vom Hub
    this.connection.on('Error', (error: string) => {
      console.error('NotificationHub error:', error);
      toast.error(`Benachrichtigungsfehler: ${error}`);
    });

    // Lifecycle
    this.connection.onclose(() => {
      store.dispatch(setConnectionStatus(false));
      if (!this.isIntentionalDisconnect) {
        const state = store.getState();
        const uid = state.auth.user?.id as string | undefined;
        if (uid) this.scheduleReconnect(uid);
      }
    });

    this.connection.onreconnecting(() => {
      store.dispatch(setConnectionStatus(false));
    });

    this.connection.onreconnected(() => {
      store.dispatch(setConnectionStatus(true));
      store.dispatch(setConnectionId(this.connection?.connectionId ?? null));
      this.reconnectAttempts = 0;
      // Nach Reconnect Notifications nachladen
      void this.getRecentNotifications();
    });
  }

  /**
   * Toast anzeigen (mit JSX → .tsx Datei)
   */
  private showToast(n: ClientNotification): void {
    const t = n.type?.toLowerCase();
    const toastType =
      t === 'success' || t === 'match' ? 'success' :
      t === 'warning' ? 'warning' :
      t === 'error' ? 'error' : 'info';

    toast(
      <div>
        <strong>{n.title}</strong>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.9em' }}>{n.message}</p>
      </div>,
      {
        type: toastType,
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      }
    );
  }

  /**
   * Exponentielles Reconnect-Backoff
   */
  private scheduleReconnect(userId: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      toast.error('Verbindung zu Benachrichtigungen verloren. Bitte Seite neu laden.');
      return;
    }
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    this.reconnectAttempts += 1;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    this.reconnectTimer = setTimeout(() => {
      this.connect(userId).catch(() => {/* Fehler wird oben bereits geloggt */});
    }, delay);
  }

  /**
   * Letzte Notifications anfordern (ruft Hub-Methode)
   */
  public async getRecentNotifications(count: number = 10): Promise<void> {
    if (this.connection?.state !== HubConnectionState.Connected) {
      throw new Error('NotificationHub not connected');
    }
    await this.connection.invoke('GetRecentNotifications', count);
  }

  /**
   * Gelesen markieren
   */
  public async markAsRead(notificationId: string): Promise<void> {
    if (this.connection?.state !== HubConnectionState.Connected) {
      throw new Error('NotificationHub not connected');
    }
    await this.connection.invoke('MarkAsRead', notificationId);
  }

  /**
   * Alle gelesen
   */
  public async markAllAsRead(): Promise<void> {
    if (this.connection?.state !== HubConnectionState.Connected) {
      throw new Error('NotificationHub not connected');
    }
    await this.connection.invoke('MarkAllAsRead');
  }

  /**
   * Typ abonnieren/abbestellen
   */
  public async subscribeToType(notificationType: string): Promise<void> {
    if (this.connection?.state !== HubConnectionState.Connected) {
      throw new Error('NotificationHub not connected');
    }
    await this.connection.invoke('SubscribeToType', notificationType);
  }

  public async unsubscribeFromType(notificationType: string): Promise<void> {
    if (this.connection?.state !== HubConnectionState.Connected) {
      throw new Error('NotificationHub not connected');
    }
    await this.connection.invoke('UnsubscribeFromType', notificationType);
  }

  /**
   * Disconnect
   */
  public async disconnect(): Promise<void> {
    this.isIntentionalDisconnect = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.connection) {
      try {
        await this.connection.stop();
      } finally {
        this.connection = null;
        store.dispatch(setConnectionStatus(false));
        store.dispatch(setConnectionId(null));
      }
    }

    this.isIntentionalDisconnect = false;
  }

  public getConnectionState(): HubConnectionState | null {
    return this.connection?.state ?? null;
  }

  public isConnected(): boolean {
    return this.connection?.state === HubConnectionState.Connected;
  }
}

// Singleton exportieren
export const notificationHubService = new NotificationHubService();
export default notificationHubService;
