import {
  type HubConnection,
  HubConnectionBuilder,
  LogLevel,
  HubConnectionState,
} from '@microsoft/signalr';
import { toast } from 'react-toastify';
import { AppointmentStatus, type Appointment } from '../../appointments/types/Appointment';
import {
  addNotification,
  setConnectionStatus,
  setConnectionId,
  setUnreadCount,
  setNotifications,
} from '../store/notificationActions';
import {
  NotificationType,
  type NotificationMetadata,
  type Notification as ClientNotification,
} from '../types/Notification';
import type { AppDispatch, RootState } from '../../../core/store/store';

// Constants
const NOT_CONNECTED_ERROR = 'NotificationHub not connected';

// Store reference pattern to avoid circular dependencies
// Store is initialized at app startup via setNotificationHubStore
let storeDispatch: AppDispatch | null = null;
let storeGetState: (() => RootState) | null = null;

export function setNotificationHubStore(dispatch: AppDispatch, getStateFn: () => RootState): void {
  storeDispatch = dispatch;
  storeGetState = getStateFn;
}

function getDispatch(): AppDispatch {
  if (!storeDispatch) {
    throw new Error(
      'NotificationHub: Store dispatch not initialized. Call setNotificationHubStore first.'
    );
  }
  return storeDispatch;
}

function getState(): RootState {
  if (!storeGetState) {
    throw new Error(
      'NotificationHub: Store getState not initialized. Call setNotificationHubStore first.'
    );
  }
  return storeGetState();
}

/**
 * Helper to map string status to AppointmentStatus enum
 */
function mapToAppointmentStatus(status: string | undefined): AppointmentStatus {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (status === undefined || status === null) return AppointmentStatus.Pending;

  const statusMap: Record<string, AppointmentStatus> = {
    Pending: AppointmentStatus.Pending,
    Confirmed: AppointmentStatus.Confirmed,
    Cancelled: AppointmentStatus.Cancelled,
    Completed: AppointmentStatus.Completed,
    Rescheduled: AppointmentStatus.Rescheduled,
  };

  return statusMap[status] ?? AppointmentStatus.Pending;
}

/**
 * SignalR payload types for type-safe event handling
 */
interface SignalRNotificationPayload {
  id?: string;
  Id?: string;
  userId?: string;
  tyoe?: string; // Note: typo from server
  title?: string;
  Subject?: string;
  Title?: string;
  message?: string;
  Content?: string;
  Message?: string;
  isRead?: boolean;
  IsRead?: boolean;
  createdAt?: string;
  CreatedAt?: string;
  readAt?: string | null;
  ReadAt?: string | null;
  actionUrl?: string | null;
  ActionUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  Metadata?: Record<string, unknown> | null;
  metadataJson?: string | null;
  MetadataJson?: string | null;
}

interface SignalRAppointmentPayload {
  id: string;
  title?: string;
  description?: string;
  scheduledDate: string;
  durationMinutes: number;
  status?: string;
  organizerUserId?: string;
  participantUserId?: string;
  skillId?: string;
  matchId?: string;
  meetingLink?: string;
  meetingType?: string;
  isSkillExchange?: boolean;
  exchangeSkillId?: string;
  exchangeSkillName?: string;
  isMonetary?: boolean;
  amount?: number;
  currency?: string;
  sessionNumber?: number;
  totalSessions?: number;
  partnerName?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Robustes Mapping: serverseitige Felder -> Client-Model
 */
function mapToClientNotification(n: SignalRNotificationPayload): ClientNotification {
  // Map server type string to NotificationType enum, defaulting to System
  const typeValue = n.tyoe ?? 'System';
  const notificationType = Object.values(NotificationType).includes(typeValue as NotificationType)
    ? (typeValue as NotificationType)
    : NotificationType.System;

  // Parse metadata if it's a string
  let metadata: NotificationMetadata | undefined;
  const rawMetadata = n.metadata ?? n.Metadata ?? n.metadataJson ?? n.MetadataJson;
  if (rawMetadata !== null && rawMetadata !== undefined) {
    if (typeof rawMetadata === 'string') {
      try {
        metadata = JSON.parse(rawMetadata) as NotificationMetadata;
      } catch {
        metadata = undefined;
      }
    } else {
      metadata = rawMetadata as NotificationMetadata;
    }
  }

  return {
    id: n.id ?? n.Id ?? '',
    userId: n.userId,
    type: notificationType,
    title: n.title ?? n.Subject ?? n.Title ?? 'Notification',
    message: n.message ?? n.Content ?? n.Message ?? '',
    isRead: n.isRead ?? n.IsRead ?? false,
    createdAt: n.createdAt ?? n.CreatedAt ?? new Date().toISOString(),
    readAt: n.readAt ?? n.ReadAt ?? undefined,
    actionUrl: n.actionUrl ?? n.ActionUrl ?? undefined,
    metadata,
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

    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
    const hubUrl = `${baseUrl}/notification-service/hubs/notifications`;

    this.connection = new HubConnectionBuilder()
      .withUrl(hubUrl, { accessTokenFactory: () => token })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (ctx) => {
          if (ctx.previousRetryCount >= this.maxReconnectAttempts) return null;
          return Math.min(1000 * 2 ** ctx.previousRetryCount, 30000);
        },
      })
      .configureLogging(LogLevel.Information)
      .build();

    this.setupEventHandlers();

    try {
      await this.connection.start();
      getDispatch()(setConnectionStatus(true));
      getDispatch()(setConnectionId(this.connection.connectionId ?? null));
      this.reconnectAttempts = 0;

      // direkt nach Connect die letzten Notifications holen
      await this.getRecentNotifications();
    } catch (err) {
      console.error('NotificationHub connect failed:', err);
      getDispatch()(setConnectionStatus(false));
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
    this.connection.on('NewNotification', (payload: SignalRNotificationPayload) => {
      const n = mapToClientNotification(payload);
      getDispatch()(addNotification(n));
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
      getDispatch()(setUnreadCount(count));
    });

    // Kürzlich (Liste)
    this.connection.on('RecentNotifications', (list: SignalRNotificationPayload[]) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      const mapped = (list ?? []).map(mapToClientNotification);
      // Wir überschreiben hier bewusst die Liste – dein Slice hat setNotifications
      getDispatch()(setNotifications(mapped));
      // Unread neu berechnen übernimmt dein Slice beim nächsten fetch; hier lassen wir den Count
      // vom Server-Event "UnreadCount" bestimmen.
    });

    // Fehler vom Hub
    this.connection.on('Error', (error: string) => {
      console.error('NotificationHub error:', error);
      toast.error(`Benachrichtigungsfehler: ${error}`);
    });

    // NEUE APPOINTMENTS (von Backend nach Match Accept)
    this.connection.on('NewAppointments', (appointments: SignalRAppointmentPayload[]) => {
      console.debug('SignalR: Received NewAppointments', appointments);

      // Map to frontend Appointment format
      const mappedAppointments: Appointment[] = appointments.map((apt) => {
        const scheduledDate = new Date(apt.scheduledDate);
        const endDate = new Date(scheduledDate.getTime() + apt.durationMinutes * 60000);

        return {
          id: apt.id,
          title: apt.title,
          description: `Session ${String(apt.sessionNumber ?? 1)} von ${String(apt.totalSessions ?? 1)}`,
          scheduledDate: apt.scheduledDate,
          startTime: scheduledDate.toISOString(),
          endTime: endDate.toISOString(),
          durationMinutes: apt.durationMinutes,
          status: mapToAppointmentStatus(apt.status ?? 'Confirmed'),
          organizerUserId: apt.organizerUserId,
          participantUserId: apt.participantUserId,
          skillId: apt.skillId ?? apt.matchId, // FIX: Use skillId if available, fallback to matchId
          matchId: apt.matchId,
          meetingLink: apt.meetingLink,
          meetingType: apt.isSkillExchange ? 'Exchange' : 'Learning',
          isSkillExchange: apt.isSkillExchange,
          exchangeSkillId: apt.exchangeSkillId, // FIX: Use actual value from payload
          isMonetary: apt.isMonetary,
          amount: apt.amount,
          currency: apt.currency,
          sessionNumber: apt.sessionNumber,
          totalSessions: apt.totalSessions,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });

      // Add to Redux store - dispatch addMany action
      getDispatch()({
        type: 'appointments/upsertMany',
        payload: mappedAppointments,
      });

      // Show toast notification
      const partnerName = appointments[0]?.partnerName ?? 'deinem Partner';
      toast.success(`🎉 ${String(appointments.length)} neue Termine mit ${partnerName} erstellt!`, {
        autoClose: 5000,
      });
    });

    // EINZELNER APPOINTMENT UPDATE
    this.connection.on('NewAppointment', (appointment: SignalRAppointmentPayload) => {
      console.debug('SignalR: Received NewAppointment', appointment);

      const scheduledDate = new Date(appointment.scheduledDate);
      const endDate = new Date(scheduledDate.getTime() + appointment.durationMinutes * 60000);

      const mappedAppointment: Appointment = {
        id: appointment.id,
        title: appointment.title,
        description: appointment.description ?? '',
        scheduledDate: appointment.scheduledDate,
        startTime: scheduledDate.toISOString(),
        endTime: endDate.toISOString(),
        durationMinutes: appointment.durationMinutes,
        status: mapToAppointmentStatus(appointment.status ?? 'Pending'),
        organizerUserId: appointment.organizerUserId,
        participantUserId: appointment.participantUserId,
        skillId: appointment.skillId ?? appointment.matchId, // FIX: Use skillId if available
        matchId: appointment.matchId,
        meetingLink: appointment.meetingLink,
        meetingType: appointment.meetingType ?? 'Learning',
        isSkillExchange: appointment.isSkillExchange,
        exchangeSkillId: appointment.exchangeSkillId, // FIX: Uncommented
        isMonetary: appointment.isMonetary,
        amount: appointment.amount, // FIX: Uncommented
        currency: appointment.currency,
        sessionNumber: appointment.sessionNumber,
        totalSessions: appointment.totalSessions, // FIX: Uncommented
        createdAt: appointment.createdAt ?? new Date().toISOString(),
        updatedAt: appointment.updatedAt ?? new Date().toISOString(),
      };

      getDispatch()({
        type: 'appointments/upsertOne',
        payload: mappedAppointment,
      });

      toast.success('Neuer Termin erstellt!');
    });

    // APPOINTMENT UPDATE
    this.connection.on('AppointmentUpdated', (appointment: SignalRAppointmentPayload) => {
      console.debug('SignalR: Received AppointmentUpdated', appointment);

      const scheduledDate = new Date(appointment.scheduledDate);
      const endDate = new Date(scheduledDate.getTime() + appointment.durationMinutes * 60000);

      const mappedUpdate: Partial<Appointment> & { id: string } = {
        id: appointment.id,
        status: mapToAppointmentStatus(appointment.status),
        scheduledDate: appointment.scheduledDate,
        startTime: scheduledDate.toISOString(),
        endTime: endDate.toISOString(),
        updatedAt: appointment.updatedAt ?? new Date().toISOString(),
      };

      getDispatch()({
        type: 'appointments/upsertOne',
        payload: mappedUpdate,
      });

      toast.info('Termin wurde aktualisiert');
    });

    // Lifecycle
    this.connection.onclose(() => {
      getDispatch()(setConnectionStatus(false));
      if (!this.isIntentionalDisconnect) {
        const state = getState();
        const uid = state.auth.user?.id;
        if (uid) this.scheduleReconnect(uid);
      }
    });

    this.connection.onreconnecting(() => {
      getDispatch()(setConnectionStatus(false));
    });

    this.connection.onreconnected(() => {
      getDispatch()(setConnectionStatus(true));
      getDispatch()(setConnectionId(this.connection?.connectionId ?? null));
      this.reconnectAttempts = 0;
      // Nach Reconnect Notifications nachladen
      this.getRecentNotifications().catch((err: unknown) => {
        console.error('Failed to get recent notifications after reconnect:', err);
      });
    });
  }

  /**
   * Toast anzeigen (mit JSX → .tsx Datei)
   */
  private showToast(n: ClientNotification): void {
    const t = n.type.toLowerCase();
    const toastTypeMap: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
      success: 'success',
      match: 'success',
      warning: 'warning',
      error: 'error',
    };
    const toastType = toastTypeMap[t] ?? 'info';

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
    const delay = this.reconnectDelay * 2 ** (this.reconnectAttempts - 1);

    this.reconnectTimer = setTimeout(() => {
      this.connect(userId).catch((_err: unknown) => {
        /* Fehler wird oben bereits geloggt */
      });
    }, delay);
  }

  /**
   * Letzte Notifications anfordern (ruft Hub-Methode)
   */
  public async getRecentNotifications(count = 10): Promise<void> {
    if (this.connection?.state !== HubConnectionState.Connected) {
      throw new Error(NOT_CONNECTED_ERROR);
    }
    await this.connection.invoke('GetRecentNotifications', count);
  }

  /**
   * Gelesen markieren
   */
  public async markAsRead(notificationId: string): Promise<void> {
    if (this.connection?.state !== HubConnectionState.Connected) {
      throw new Error(NOT_CONNECTED_ERROR);
    }
    await this.connection.invoke('MarkAsRead', notificationId);
  }

  /**
   * Alle gelesen
   */
  public async markAllAsRead(): Promise<void> {
    if (this.connection?.state !== HubConnectionState.Connected) {
      throw new Error(NOT_CONNECTED_ERROR);
    }
    await this.connection.invoke('MarkAllAsRead');
  }

  /**
   * Typ abonnieren/abbestellen
   */
  public async subscribeToType(notificationType: string): Promise<void> {
    if (this.connection?.state !== HubConnectionState.Connected) {
      throw new Error(NOT_CONNECTED_ERROR);
    }
    await this.connection.invoke('SubscribeToType', notificationType);
  }

  public async unsubscribeFromType(notificationType: string): Promise<void> {
    if (this.connection?.state !== HubConnectionState.Connected) {
      throw new Error(NOT_CONNECTED_ERROR);
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
        getDispatch()(setConnectionStatus(false));
        getDispatch()(setConnectionId(null));
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
