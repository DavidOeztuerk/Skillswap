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
