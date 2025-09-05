# Skillswap

SkillSwap ist eine Microservice-Plattform, auf der Nutzer ihre Kenntnisse
gegenseitig tauschen können. Die Anwendung besteht aus mehreren .NET 9
Services sowie einem React-Frontend. Alle Komponenten lassen sich über
`docker-compose` starten.

## Voraussetzungen

- [Docker](https://www.docker.com/) und Docker Compose müssen installiert sein.
- Für die lokalen Images werden keine weiteren Abhängigkeiten benötigt.

## Schnellstart

1. Repository klonen

   ```bash
   git clone https://example.com/skillswap.git
   cd Skillswap
   ```

2. Benötigte Umgebungsvariablen setzen (z.B. in einer `.env` Datei). Für ein
   lokales Setup reichen Beispielwerte:

   ```bash
   export JWT_SECRET=SuperSecret
   export JWT_ISSUER=Skillswap
   export JWT_AUDIENCE=Skillswap
   ```

3. Alle Services starten

   ```bash
   docker-compose up --build
   ```

   Der Gateway ist danach unter [http://localhost:8080](http://localhost:8080)
   erreichbar, das Frontend unter [http://localhost:3000](http://localhost:3000).

Damit ist die komplette Entwicklungsumgebung eingerichtet.

## Service Endpoints & Routen

### Service Ports (Local Development)

| Service | Port | Beschreibung |
|---------|------|--------------|
| Gateway | 8080 | API Gateway (Haupteinstiegspunkt) |
| UserService | 5001 | Benutzer & Authentifizierung |
| SkillService | 5002 | Skills & Kategorien |
| NotificationService | 5003 | Benachrichtigungen |
| MatchmakingService | 5004 | Skill-Matching |
| AppointmentService | 5005 | Terminverwaltung |
| VideocallService | 5006 | Video-Calls |
| Frontend | 3000 | React Frontend |

### Monitoring & Health Endpoints

Jeder Service bietet folgende Monitoring-Endpoints:

#### Health Checks
- `GET /health` - Allgemeiner Health-Status mit allen Checks
- `GET /health/live` - Liveness Probe (Ist der Service am Leben?)
- `GET /health/ready` - Readiness Probe (Ist der Service bereit für Requests?)

**Beispiel Response:**
```json
{
  "status": "Healthy",
  "timestamp": "2025-09-04T09:37:27.625595Z",
  "durationMs": 65.3114,
  "checks": [
    {
      "name": "redis",
      "status": "Healthy",
      "tags": ["ready", "cache"]
    },
    {
      "name": "database",
      "status": "Healthy",
      "tags": ["ready", "db"]
    }
  ]
}
```

#### Metrics (Prometheus)
- `GET /metrics` - Prometheus-kompatible Metriken

**Verfügbare Metriken:**
- Garbage Collection Stats
- JIT Compilation Metrics
- Thread Pool Metrics
- Memory Usage
- CPU Usage
- Request Duration
- Exception Count

#### API Documentation (Swagger)
- `GET /api-docs` - Swagger UI für API-Dokumentation
- `GET /api-docs/index.html` - Alternative URL für Swagger UI

### Gateway Routes (Port 8080)

Das Gateway leitet Requests an die entsprechenden Services weiter:

#### Authentication & Users
- `POST /api/users/register` → UserService
- `POST /api/users/login` → UserService
- `POST /api/users/refresh-token` → UserService
- `POST /api/users/verify-email` → UserService
- `POST /api/users/request-password-reset` → UserService
- `GET /api/users/profile` → UserService (Auth required)
- `PUT /api/users/profile` → UserService (Auth required)

#### Skills
- `GET /api/skills` → SkillService (Auth required)
- `GET /api/skills/{id}` → SkillService (Auth required)
- `POST /api/skills` → SkillService (Auth required)
- `PUT /api/skills/{id}` → SkillService (Auth required)
- `DELETE /api/skills/{id}` → SkillService (Auth required)
- `GET /api/skills/categories` → SkillService
- `GET /api/skills/proficiency-levels` → SkillService

#### Notifications
- `GET /api/notifications` → NotificationService (Auth required)
- `PUT /api/notifications/{id}/read` → NotificationService (Auth required)
- `DELETE /api/notifications/{id}` → NotificationService (Auth required)
- `POST /api/notifications/settings` → NotificationService (Auth required)

#### Matchmaking
- `GET /api/matches` → MatchmakingService (Auth required)
- `POST /api/matches/search` → MatchmakingService (Auth required)
- `POST /api/matches/{id}/accept` → MatchmakingService (Auth required)
- `POST /api/matches/{id}/decline` → MatchmakingService (Auth required)

#### Appointments
- `GET /api/appointments` → AppointmentService (Auth required)
- `POST /api/appointments` → AppointmentService (Auth required)
- `PUT /api/appointments/{id}` → AppointmentService (Auth required)
- `DELETE /api/appointments/{id}` → AppointmentService (Auth required)

#### Video Calls
- `POST /api/videocalls/room` → VideocallService (Auth required)
- `GET /api/videocalls/room/{roomId}` → VideocallService (Auth required)
- `POST /api/videocalls/token` → VideocallService (Auth required)

### Caching & Performance

Die Anwendung nutzt Redis für:
- **Distributed Caching** mit automatischer Cache-Invalidierung
- **Rate Limiting** (verteiltes Rate Limiting über alle Instanzen)
- **Session Storage** für Token-Revocation

#### Cache-Performance
- 50-95% Performance-Verbesserung bei gecachten Queries
- Automatische Cache-Invalidierung bei Datenänderungen
- Fallback zu In-Memory-Cache wenn Redis nicht verfügbar

### Security Features

- **JWT Authentication** mit Token-Refresh
- **2FA Support** über TOTP
- **Rate Limiting** pro Endpoint konfigurierbar
- **RBAC** (Role-Based Access Control)
- **Input Sanitization** automatisch für alle Requests
- **Security Headers** (CSP, HSTS, etc.)
- **Data Encryption** für sensitive Daten
- **Audit Logging** für Security-Events

### Lokale Entwicklung ohne Docker

Für lokale Entwicklung ohne Docker:

1. **Infrastruktur starten** (PostgreSQL, Redis, RabbitMQ)
   ```bash
   brew services start postgresql
   brew services start redis
   brew services start rabbitmq
   ```

2. **Services starten**
   ```bash
   # Gateway
   cd src/services/Gateway && dotnet run
   
   # UserService
   cd src/services/UserService/UserService.Api && dotnet run
   
   # SkillService
   cd src/services/SkillService && dotnet run
   
   # Weitere Services analog...
   ```

3. **Frontend starten**
   ```bash
   cd src/client && npm install && npm run dev
   ```

## Error Tracking & Monitoring

Die Anwendung verfügt über ein umfassendes Error Handling System mit Unterstützung für externe Error Tracking Services.

### Konfiguration

Um externes Error Tracking zu aktivieren, erstellen Sie eine `.env` Datei im `src/client` Verzeichnis mit folgenden Variablen:

```env
# Error Logger Service (sentry, logrocket, oder custom)
VITE_ERROR_LOGGER_SERVICE=sentry

# API Key für den gewählten Service
VITE_ERROR_LOGGER_API_KEY=your-api-key-here

# Endpoint (nur für custom service benötigt)
VITE_ERROR_LOGGER_ENDPOINT=https://your-error-endpoint.com

# App Version (optional)
VITE_APP_VERSION=1.0.0
```

### Unterstützte Services

- **Sentry**: Vollständiges Error Tracking mit Breadcrumbs und User Context
- **LogRocket**: Session Replay und Error Tracking
- **Custom**: Eigener Error Tracking Endpoint

### Features

- 🛡️ **Error Boundaries**: Graceful error handling für alle Hauptbereiche
  - GlobalErrorBoundary (App-Level)
  - Feature-spezifische Boundaries (Admin, Skills, Matching, Appointments)
- 📊 **Breadcrumb Tracking**: Automatisches Tracking von User-Aktionen
- 👤 **User Context**: Fehler werden mit User-Informationen verknüpft
- 🔄 **Retry Logic**: Automatische Wiederholungsversuche bei Async-Fehlern
- 💾 **Offline Queue**: Fehler werden zwischengespeichert und später gesendet

### Aktivierung

1. Installieren Sie den gewünschten Error Tracking Service (z.B. `npm install @sentry/react`)
2. Konfigurieren Sie die `.env` Datei mit Ihren Credentials
3. Entkommentieren Sie den Code-Block in `src/client/src/services/errorLogger.ts`

**Hinweis**: Ohne Konfiguration nutzt das System nur Console-Logging. Dies ist ausreichend für Development, aber für Production wird externes Error Tracking empfohlen.
