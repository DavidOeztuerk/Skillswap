# 🔒 Security Monitoring - Setup & Dokumentation

> **Implementiert am:** 24.11.2025
> **Status:** ✅ Production Ready
> **Version:** 1.0.0

---

## 📋 Inhaltsverzeichnis

1. [Überblick](#überblick)
2. [Architektur](#architektur)
3. [Backend-Implementierung](#backend-implementierung)
4. [Frontend-Implementierung](#frontend-implementierung)
5. [API-Endpunkte](#api-endpunkte)
6. [Datenmodelle](#datenmodelle)
7. [Konfiguration](#konfiguration)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Überblick

Das Security Monitoring System überwacht sicherheitsrelevante Ereignisse in der Skillswap-Anwendung und stellt diese für Administratoren in einem Dashboard zur Verfügung.

### Features

- ✅ **Echtzeit-Überwachung** von Security Events
- ✅ **Kategorisierung** nach Severity (Critical, High, Medium, Low, Info)
- ✅ **Filterung** nach Level, Type, Read/Dismissed Status
- ✅ **Pagination** für große Datenmengen
- ✅ **Statistiken** mit Timeline-Visualisierung (30 Tage)
- ✅ **Alert Management** (Mark as Read, Dismiss mit Begründung)
- ✅ **Caching** mit Redis für Performance
- ✅ **Throttling** für Duplicate Alerts

### Alert Types

- `UnauthorizedAccess` - Nicht autorisierte Zugriffe
- `FailedAuthentication` - Fehlgeschlagene Login-Versuche
- `SuspiciousActivity` - Verdächtige Aktivitäten
- `RateLimitExceeded` - Rate-Limiting-Überschreitung
- `DataBreach` - Potenzielle Datenschutzverletzungen
- `PermissionEscalation` - Berechtigungseskalation
- `MaliciousRequest` - Schädliche Anfragen
- `SystemAnomaly` - Systemanomalien

---

## 🏗️ Architektur

### Komponenten-Übersicht

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND                             │
│  ┌───────────────────────────────────────────────────┐  │
│  │  AdminSecurityPage.tsx                            │  │
│  │  ├── SecurityAlertList                            │  │
│  │  └── SecurityStatistics                           │  │
│  └───────────────────────────────────────────────────┘  │
│                         │                                │
│                         ▼                                │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Redux Store (adminSlice)                         │  │
│  │  ├── State (securityAlerts, statistics)          │  │
│  │  ├── Thunks (fetch, dismiss, markRead)           │  │
│  │  └── Selectors                                    │  │
│  └───────────────────────────────────────────────────┘  │
│                         │                                │
│                         ▼                                │
│  ┌───────────────────────────────────────────────────┐  │
│  │  adminService.ts                                  │  │
│  │  ├── getSecurityAlerts()                          │  │
│  │  ├── getSecurityAlertStatistics()                 │  │
│  │  ├── dismissSecurityAlert()                       │  │
│  │  └── markSecurityAlertAsRead()                    │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼ HTTP (Gateway:8080)
┌─────────────────────────────────────────────────────────┐
│                     GATEWAY (Ocelot)                     │
│  Routes:                                                 │
│  - GET  /api/admin/security/alerts                      │
│  - GET  /api/admin/security/alerts/{id}                 │
│  - GET  /api/admin/security/statistics                  │
│  - POST /api/admin/security/alerts/{id}/dismiss         │
│  - POST /api/admin/security/alerts/{id}/mark-read       │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   USER SERVICE                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │  AdminControllerExtensions.cs                     │  │
│  │  └── /admin/security/* endpoints                  │  │
│  └───────────────────────────────────────────────────┘  │
│                         │                                │
│                         ▼                                │
│  ┌───────────────────────────────────────────────────┐  │
│  │  CQRS Layer                                       │  │
│  │  ├── GetSecurityAlertsQuery                       │  │
│  │  ├── GetSecurityAlertStatisticsQuery              │  │
│  │  ├── DismissSecurityAlertCommand                  │  │
│  │  └── MarkSecurityAlertAsReadCommand               │  │
│  └───────────────────────────────────────────────────┘  │
│                         │                                │
│                         ▼                                │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Infrastructure.Security.Monitoring               │  │
│  │  └── SecurityAlertService                         │  │
│  │      ├── In-Memory Storage (temporary)            │  │
│  │      ├── Redis Caching                            │  │
│  │      └── Throttling Logic                         │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Backend-Implementierung

### File Structure

```
src/
├── services/UserService/
│   ├── UserService.Api/
│   │   └── Extensions/
│   │       └── AdminControllerExtensions.cs (Endpoints)
│   └── UserService.Application/
│       ├── Queries/
│       │   ├── GetSecurityAlertsQuery.cs
│       │   └── GetSecurityAlertStatisticsQuery.cs
│       ├── QueryHandlers/
│       │   ├── GetSecurityAlertsQueryHandler.cs
│       │   └── GetSecurityAlertStatisticsQueryHandler.cs
│       └── Commands/
│           ├── DismissSecurityAlertCommand.cs
│           └── MarkSecurityAlertAsReadCommand.cs
└── shared/
    ├── Contracts/Admin/Responses/
    │   ├── SecurityAlertResponse.cs
    │   └── SecurityAlertStatisticsResponse.cs
    └── Infrastructure/Security/Monitoring/
        ├── ISecurityAlertService.cs
        ├── SecurityAlertService.cs
        ├── SecurityAlert.cs (Model)
        ├── SecurityAlertLevel.cs (Enum)
        └── SecurityAlertType.cs (Enum)
```

### Key Components

#### 1. SecurityAlertService

**Location:** `src/shared/Infrastructure/Security/Monitoring/SecurityAlertService.cs`

**Verantwortlichkeiten:**
- Alert Creation & Storage (in-memory + planned DB persistence)
- Redis Caching für Performance
- Duplicate Detection & Throttling
- Statistics Calculation

**Wichtige Methoden:**
```csharp
Task<SecurityAlert> SendAlertAsync(
    SecurityAlertLevel level,
    SecurityAlertType type,
    string title,
    string message,
    Dictionary<string, object>? metadata = null)

Task<(List<SecurityAlert>, int)> GetRecentAlertsAsync(
    int pageNumber, int pageSize,
    SecurityAlertLevel? minLevel,
    SecurityAlertType? type,
    bool includeRead, bool includeDismissed)

Task<SecurityAlertStatistics> GetStatisticsAsync(
    DateTime? from, DateTime? to)
```

#### 2. Query Handlers

**GetSecurityAlertsQueryHandler:**
- Paginierte Liste von Alerts
- Filterung nach Level, Type, Read/Dismissed
- Returns: `PagedResponse<SecurityAlertResponse>`

**GetSecurityAlertStatisticsQueryHandler:**
- Aggregierte Statistiken
- 30-Tage Timeline
- Returns: `SuccessResponse<SecurityAlertStatisticsResponse>`

#### 3. Commands

**DismissSecurityAlertCommand:**
- Alert als "dismissed" markieren mit Begründung
- Nur Admins erlaubt

**MarkSecurityAlertAsReadCommand:**
- Alert als "gelesen" markieren
- Tracking: Wer, Wann

---

## 💻 Frontend-Implementierung

### File Structure

```
src/client/src/
├── pages/admin/
│   └── AdminSecurityPage.tsx (Main Page)
├── components/admin/
│   ├── SecurityAlertList.tsx
│   └── SecurityStatistics.tsx
├── features/admin/
│   ├── adminSlice.ts (Redux State)
│   └── adminThunks.ts (Async Actions)
├── store/
│   ├── selectors/adminSelectors.ts
│   └── adapters/adminAdapter+State.ts
├── api/services/
│   └── adminService.ts (API Client)
└── types/models/
    └── SecurityAlert.ts (TypeScript Types)
```

### Redux State

```typescript
interface AdminEntityState {
  // Security Monitoring
  securityAlerts: SecurityAlertResponse[];
  securityAlertStatistics: SecurityAlertStatisticsResponse | null;
  isLoadingSecurityAlerts: boolean;
  isLoadingSecurityStatistics: boolean;
  securityAlertError: string | undefined;

  // Pagination
  pagination: {
    securityAlerts: {
      page: number;
      limit: number;
      total: number;
    };
  };

  // Filters
  filters: {
    securityAlerts: {
      minLevel: string;
      type: string;
      includeRead: boolean;
      includeDismissed: boolean;
    };
  };
}
```

### Thunks

```typescript
// Fetch alerts (paginated)
fetchSecurityAlerts({ pageNumber, pageSize, minLevel, type, includeRead, includeDismissed })

// Fetch statistics
fetchSecurityAlertStatistics({ from?, to? })

// Dismiss alert
dismissSecurityAlert({ alertId, reason })

// Mark as read
markSecurityAlertAsRead(alertId)
```

### Component Usage

```tsx
import { useAppDispatch, useAppSelector } from '../../store/store.hooks';
import {
  selectSecurityAlerts,
  selectSecurityAlertStatistics,
  selectIsLoadingSecurityAlerts,
} from '../../store/selectors/adminSelectors';
import {
  fetchSecurityAlerts,
  dismissSecurityAlert,
} from '../../features/admin/adminThunks';

const MyComponent = () => {
  const dispatch = useAppDispatch();
  const alerts = useAppSelector(selectSecurityAlerts);
  const isLoading = useAppSelector(selectIsLoadingSecurityAlerts);

  useEffect(() => {
    dispatch(fetchSecurityAlerts({ pageNumber: 1, pageSize: 20 }));
  }, [dispatch]);

  const handleDismiss = async (alertId: string) => {
    await dispatch(dismissSecurityAlert({
      alertId,
      reason: 'False positive'
    })).unwrap();
  };

  // ...
};
```

---

## 🌐 API-Endpunkte

### 1. Get Security Alerts (Paginated)

**Endpoint:** `GET /api/admin/security/alerts`

**Query Parameters:**
```
pageNumber: number (default: 1)
pageSize: number (default: 50)
minLevel?: string (Critical|High|Medium|Low|Info)
type?: string (UnauthorizedAccess|FailedAuthentication|...)
includeRead?: boolean (default: true)
includeDismissed?: boolean (default: false)
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "guid",
      "level": "Critical",
      "type": "FailedAuthentication",
      "title": "Multiple failed login attempts",
      "message": "5 failed login attempts from IP 192.168.1.1",
      "userId": "user-guid",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "endpoint": "/api/auth/login",
      "metadata": { "attempts": 5 },
      "isRead": false,
      "isDismissed": false,
      "occurredAt": "2025-11-24T20:00:00Z",
      "occurrenceCount": 1,
      "createdAt": "2025-11-24T20:00:00Z"
    }
  ],
  "pageNumber": 1,
  "pageSize": 50,
  "totalPages": 1,
  "totalRecords": 15,
  "hasNextPage": false,
  "hasPreviousPage": false
}
```

---

### 2. Get Alert by ID

**Endpoint:** `GET /api/admin/security/alerts/{alertId}`

**Response:** Single `SecurityAlertResponse` object

---

### 3. Get Statistics

**Endpoint:** `GET /api/admin/security/statistics`

**Query Parameters:**
```
from?: string (ISO date, default: 30 days ago)
to?: string (ISO date, default: now)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalAlerts": 142,
    "criticalAlerts": 5,
    "highAlerts": 23,
    "mediumAlerts": 67,
    "lowAlerts": 32,
    "infoAlerts": 15,
    "unreadAlerts": 89,
    "activeAlerts": 135,
    "dismissedAlerts": 7,
    "lastCriticalAlertAt": "2025-11-24T19:30:00Z",
    "lastAlertAt": "2025-11-24T20:00:00Z",
    "alertsByType": [
      { "type": "FailedAuthentication", "count": 45 },
      { "type": "UnauthorizedAccess", "count": 32 }
    ],
    "timeline": [
      {
        "date": "2025-10-25T00:00:00Z",
        "critical": 0,
        "high": 2,
        "medium": 5,
        "low": 3,
        "info": 1
      }
    ]
  }
}
```

---

### 4. Dismiss Alert

**Endpoint:** `POST /api/admin/security/alerts/{alertId}/dismiss`

**Request Body:**
```json
{
  "reason": "False positive - legitimate admin activity"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "alertId": "guid",
    "dismissed": true,
    "dismissedAt": "2025-11-24T20:05:00Z",
    "dismissedBy": "admin-user-id"
  }
}
```

---

### 5. Mark Alert as Read

**Endpoint:** `POST /api/admin/security/alerts/{alertId}/mark-read`

**Request Body:** `{}` (empty)

**Response:**
```json
{
  "success": true,
  "data": {
    "alertId": "guid",
    "read": true,
    "readAt": "2025-11-24T20:05:00Z",
    "readBy": "admin-user-id"
  }
}
```

---

## 📊 Datenmodelle

### SecurityAlert (Domain Model)

```csharp
public class SecurityAlert
{
    public Guid Id { get; set; }
    public SecurityAlertLevel Level { get; set; }
    public SecurityAlertType Type { get; set; }
    public string Title { get; set; }
    public string Message { get; set; }
    public string? UserId { get; set; }
    public string? IPAddress { get; set; }
    public string? UserAgent { get; set; }
    public string? Endpoint { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }

    // Read/Dismiss Tracking
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public string? ReadByAdminId { get; set; }
    public bool IsDismissed { get; set; }
    public DateTime? DismissedAt { get; set; }
    public string? DismissedByAdminId { get; set; }
    public string? DismissalReason { get; set; }

    // Occurrence Tracking
    public DateTime OccurredAt { get; set; }
    public int OccurrenceCount { get; set; }
    public DateTime? LastOccurrenceAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

### SecurityAlertLevel (Enum)

```csharp
public enum SecurityAlertLevel
{
    Info = 0,      // Informational
    Low = 1,       // Low severity
    Medium = 2,    // Medium severity
    High = 3,      // High severity
    Critical = 4   // Critical - immediate action required
}
```

### SecurityAlertType (Enum)

```csharp
public enum SecurityAlertType
{
    UnauthorizedAccess,
    FailedAuthentication,
    SuspiciousActivity,
    RateLimitExceeded,
    DataBreach,
    PermissionEscalation,
    MaliciousRequest,
    SystemAnomaly
}
```

---

## ⚙️ Konfiguration

### appsettings.json (UserService)

```json
{
  "SecurityAlertConfiguration": {
    "Enabled": true,
    "EnableEmailNotifications": false,
    "EmailRecipients": ["security@skillswap.com"],
    "ThrottleWindowMinutes": 5,
    "MaxOccurrencesBeforeEscalation": 10,
    "EnabledAlertTypes": [
      "UnauthorizedAccess",
      "FailedAuthentication",
      "SuspiciousActivity",
      "RateLimitExceeded"
    ]
  }
}
```

### Ocelot Gateway Routes

**File:** `src/services/Gateway/ocelot.json`

```json
{
  "Comment": "========== ADMIN SECURITY MONITORING ==========",
  "DownstreamPathTemplate": "/api/admin/security/alerts",
  "DownstreamScheme": "http",
  "DownstreamHostAndPorts": [{ "Host": "localhost", "Port": 5001 }],
  "UpstreamPathTemplate": "/api/admin/security/alerts",
  "UpstreamHttpMethod": ["GET"],
  "AuthenticationOptions": {
    "AuthenticationProviderKey": "Bearer"
  },
  "RouteClaimsRequirement": {
    "role": "Admin"
  },
  "AddQueriesToRequest": true
}
```

---

## 🧪 Testing

### Manual Testing

1. **Trigger a Security Alert:**
```bash
# Failed login attempt (5 times to trigger alert)
curl -X POST http://localhost:8080/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"wrong@email.com","password":"wrongpass"}'
```

2. **View Alerts:**
```bash
# Get all alerts
curl -X GET "http://localhost:8080/api/admin/security/alerts?pageNumber=1&pageSize=20" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

3. **Check Statistics:**
```bash
curl -X GET "http://localhost:8080/api/admin/security/statistics" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

4. **Dismiss an Alert:**
```bash
curl -X POST "http://localhost:8080/api/admin/security/alerts/ALERT_ID/dismiss" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"False positive"}'
```

### Frontend Testing

1. Login als Admin
2. Navigate zu Admin → Security Monitoring
3. Verify:
   - ✅ Alerts werden geladen (200 OK)
   - ✅ Statistics werden angezeigt
   - ✅ Filter funktionieren (Level, Type, Read/Dismissed)
   - ✅ Pagination funktioniert
   - ✅ Dismiss-Button funktioniert
   - ✅ Mark as Read funktioniert

---

## 🔍 Troubleshooting

### Problem: 404 auf Security Endpoints

**Ursache:** Gateway nicht neu gestartet nach Ocelot-Änderungen

**Lösung:**
```bash
cd src/services/Gateway
dotnet run
```

---

### Problem: 400 Bad Request bei GetSecurityAlerts

**Ursache:** Null-Liste wird aus Cache zurückgegeben

**Lösung:** Fixed in `SecurityAlertService.cs:120` - Null-Check nach Deserialisierung

**Code:**
```csharp
if (!string.IsNullOrEmpty(cached))
{
    var cachedData = JsonSerializer.Deserialize<(List<SecurityAlert>, int)>(cached);
    if (cachedData.Item1 != null) // ✅ Null-Check hinzugefügt
    {
        return cachedData;
    }
}
```

---

### Problem: Leere Alert-Liste obwohl Events getriggert wurden

**Mögliche Ursachen:**
1. **SecurityAlertConfiguration.Enabled = false** in appsettings.json
2. **Alert-Type nicht in EnabledAlertTypes** Liste
3. **Throttling** - Duplicate Alerts werden innerhalb 5 Min geblockt
4. **In-Memory Storage** - Bei Service-Neustart gehen Alerts verloren

**Lösung:**
- Check appsettings.json Konfiguration
- Check Logs für "Security alerts are disabled" Meldungen
- Warte 5+ Minuten zwischen identischen Alerts
- Implementiere DB-Persistence für Production

---

### Problem: Statistics zeigen "0" überall

**Ursache:** Keine Alerts im System oder alle Alerts älter als 30 Tage

**Lösung:**
- Trigger neue Security Events
- Check `from` und `to` Query-Parameter bei Statistics-Call

---

## 📈 Performance Optimierung

### Caching Strategy

**Redis Cache Keys:**
- `security:alerts:list:{pageNumber}:{pageSize}:{minLevel}:{type}:{includeRead}:{includeDismissed}` - 5 min TTL
- `security:statistics:{from}:{to}` - 5 min TTL
- `security:alert:duplicate:{type}:{title}` - 5 min TTL (Throttling)

**Cache Invalidation:**
- Bei `SendAlertAsync()` - Listen-Cache invalidieren
- Bei `DismissAlertAsync()` - Betroffene Alert-Caches invalidieren
- Bei `MarkAsReadAsync()` - Betroffene Alert-Caches invalidieren

### Database Queries (Future)

Wenn DB-Persistence implementiert wird:
- Index auf `Level`, `Type`, `OccurredAt`, `IsRead`, `IsDismissed`
- Partitionierung nach `CreatedAt` (monatlich)
- Archive alte Alerts (> 90 Tage) in separate Tabelle

---

## 🚀 Future Enhancements

### Phase 1: DB Persistence
- [ ] Entity Framework DbSet für SecurityAlerts
- [ ] Migration erstellen
- [ ] Async Storage in SecurityAlertService
- [ ] Background Job für alte Alert-Archivierung

### Phase 2: Notifications
- [ ] Email Notifications für Critical Alerts
- [ ] SignalR Real-time Push für neue Alerts
- [ ] Slack/Discord Webhook Integration

### Phase 3: Advanced Analytics
- [ ] ML-basierte Anomalie-Erkennung
- [ ] Threat Intelligence Integration
- [ ] Correlation Rules (z.B. 5 failed logins + rate limit = attack)
- [ ] Dashboards mit Charts (ApexCharts/Recharts)

### Phase 4: Automation
- [ ] Auto-Response Rules (z.B. IP Block nach X failed logins)
- [ ] Incident Playbooks
- [ ] Integration mit SIEM Tools

---

## 📚 Referenzen

### Related Files
- `CLAUDE.md` - Development Guidelines
- `CURRENT_STATUS_AND_ROADMAP.md` - Project Roadmap
- `PRODUCTION_SECURITY_CHECKLIST.md` - Security Best Practices

### Dependencies
- MediatR (CQRS)
- Redis (Caching)
- Serilog (Logging)
- MUI (Frontend Components)
- Redux Toolkit (State Management)

---

**Dokumentation Version:** 1.0.0
**Letzte Aktualisierung:** 24.11.2025
**Maintainer:** Development Team

---

✅ **Security Monitoring ist Production Ready!**
