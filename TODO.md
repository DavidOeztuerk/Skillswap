<!-- # TODO.md - Skillswap Development Tasks

## 🚨 Immediate Priority Tasks (Current Sprint)

### 1. Authentication & Authorization
- [x] Complete 2FA implementation in frontend ✅
- [x] Fix JWT token refresh mechanism ✅
- [x] Implement proper RBAC checks in all admin areas ✅
- [x] Fix authentication flow issues ✅
- [x] Implement role hierarchy (SuperAdmin > Admin > Moderator > User) ✅
- [x] Add case-insensitive role comparison ✅
- [ ] Add session anomaly detection
- [ ] Implement account lockout after failed attempts
- [ ] Add password strength requirements

### 2. Frontend Stability
- [x] Fix multiple re-render issues with React.memo (Sidebar optimized) ✅
- [x] Add error handling for missing API endpoints ✅
- [x] Add comprehensive null/undefined checks throughout ✅
- [x] Fix request/response type mismatches with backend ✅
- [x] Implement proper error boundaries ✅
- [x] Add loading states for all async operations ✅
- [ ] Implement optimistic updates for better UX
- [ ] Add proper TypeScript types for all API responses

### 3. Core Features Stabilization
- [ ] Complete skill CRUD operations
- [ ] Fix matching algorithm edge cases
- [ ] Implement appointment conflict detection
- [ ] Add appointment rescheduling functionality
- [ ] Complete video call signaling setup
- [ ] Test WebRTC connection establishment
- [ ] Implement notification preferences UI

### 4. Database & Performance
- [ ] Implement database connection pooling
- [ ] Add proper indexes for frequently queried fields
- [ ] Configure cascade delete rules properly
- [ ] Implement Redis caching strategy
- [ ] Add cache invalidation logic
- [ ] Optimize N+1 query issues
- [ ] Add database query performance monitoring

## 📋 Short-term Tasks (Next 2-3 Sprints)

### 5. Clean Architecture Migration
- [ ] Migrate SkillService to Clean Architecture
- [ ] Migrate MatchmakingService to Clean Architecture
- [ ] Migrate AppointmentService to Clean Architecture
- [ ] Migrate VideocallService to Clean Architecture
- [ ] Implement repository pattern in all services
- [ ] Add specification pattern for complex queries

### 6. Testing Infrastructure
- [ ] Set up unit test framework
- [ ] Write unit tests for UserService
- [ ] Write unit tests for all command handlers
- [ ] Add integration tests for critical paths
- [ ] Implement contract testing between services
- [ ] Add performance benchmarks
- [ ] Set up test coverage reporting

### 7. Event Sourcing & CQRS
- [ ] Complete event sourcing implementation
- [ ] Add event store for audit trail
- [ ] Implement read models for queries
- [ ] Add projections for denormalized views
- [ ] Implement saga pattern for distributed transactions
- [ ] Add event replay capability

### 8. Infrastructure Improvements
- [ ] Separate PostgreSQL instances per service
- [ ] Implement Redis backplane for SignalR
- [ ] Add distributed tracing with OpenTelemetry
- [ ] Set up Prometheus metrics collection
- [ ] Implement health check endpoints
- [ ] Add circuit breakers for resilience
- [ ] Configure retry policies

## 🎯 Medium-term Tasks

### 9. DevOps & CI/CD
- [ ] Set up GitHub Actions pipeline
- [ ] Add automated testing in CI
- [ ] Implement Docker image building
- [ ] Add security scanning (Trivy)
- [ ] Set up staging environment
- [ ] Implement blue-green deployment
- [ ] Add rollback mechanisms

### 10. Kubernetes Deployment
- [ ] Create Kubernetes manifests
- [ ] Set up Helm charts
- [ ] Configure auto-scaling policies
- [ ] Implement pod disruption budgets
- [ ] Add network policies
- [ ] Set up ingress controller
- [ ] Configure secrets management

### 11. Security Enhancements
- [ ] Implement mTLS between services
- [ ] Add API key rotation
- [ ] Set up HashiCorp Vault
- [ ] Implement field-level encryption
- [ ] Add GDPR compliance tools
- [ ] Implement data retention policies
- [ ] Add security event monitoring

### 12. Admin Panel
- [x] Complete user management interface (basic implementation) ✅
- [x] Implement role-based access to admin panel ✅
- [x] Add role hierarchy restrictions in UserManagement ✅
- [ ] Complete analytics dashboard implementation
- [ ] Add skill moderation tools
- [ ] Add system health monitoring
- [ ] Create report generation tools
- [ ] Add bulk operations support
- [ ] Implement audit log viewer
- [ ] Add admin metrics page
- [ ] Complete admin appointments page
- [ ] Complete admin matches page

## 🔧 Code Quality Tasks

### 13. Refactoring
- [ ] Standardize error handling across services
- [ ] Implement consistent logging format
- [ ] Refactor duplicate code into shared libraries
- [ ] Update all services to .NET 9 features
- [ ] Optimize LINQ queries
- [ ] Remove unused dependencies
- [ ] Update deprecated packages

### 14. Documentation
- [ ] Create API documentation with Swagger
- [ ] Write developer onboarding guide
- [ ] Document architecture decisions (ADRs)
- [ ] Create deployment documentation
- [ ] Write troubleshooting guide
- [ ] Document performance tuning tips
- [ ] Create security best practices guide

### 15. Frontend Optimization
- [ ] Implement code splitting
- [ ] Add lazy loading for routes
- [ ] Optimize bundle size
- [ ] Implement PWA features
- [ ] Add offline capability
- [ ] Optimize images and assets
- [ ] Implement virtual scrolling for lists

## 🚀 Future Enhancements

### 16. Advanced Features
- [ ] AI-powered skill recommendations
- [ ] Machine learning for match optimization
- [ ] Blockchain for skill verification
- [ ] Multi-language support (i18n)
- [ ] Mobile app development
- [ ] Voice/video transcription
- [ ] Advanced analytics and reporting

### 17. Scalability
- [ ] Implement database sharding
- [ ] Add read replicas
- [ ] Set up CDN for static assets
- [ ] Implement edge computing
- [ ] Add GraphQL gateway
- [ ] Migrate to event streaming (Kafka)
- [ ] Implement CQRS read models

### 18. Monitoring & Observability
- [ ] Set up ELK stack
- [ ] Implement distributed tracing
- [ ] Add custom metrics
- [ ] Create SLI/SLO dashboards
- [ ] Set up alerting rules
- [ ] Add performance profiling
- [ ] Implement chaos engineering

## 📊 Progress Tracking

### Completed ✅
- [x] Initial microservices setup
- [x] Basic authentication implementation
- [x] Docker containerization
- [x] API Gateway configuration
- [x] Basic frontend structure
- [x] Redux state management
- [x] Database schema design
- [x] RBAC with permissions system
- [x] Role hierarchy implementation
- [x] PermissionContext for frontend
- [x] Admin panel basic structure
- [x] User management interface

### In Progress 🔄
- [x] RBAC implementation (100%) ✅
- [ ] Frontend-backend integration (70%)
- [ ] Event-driven architecture (80%)
- [ ] Clean Architecture (UserService 100%, others 40%)
- [ ] Admin panel pages implementation (30%)

### Blocked 🚫
- [ ] Production database migration (waiting for infrastructure)
- [ ] CI/CD pipeline (waiting for DevOps approval)
- [ ] Mobile app development (waiting for API stability)

## 💡 Quick Wins
1. Add loading spinners to all buttons
2. Implement toast notifications for user feedback
3. Add keyboard shortcuts for common actions
4. Improve error messages to be user-friendly
5. Add tooltips for complex UI elements
6. Implement breadcrumb navigation
7. Add "Remember me" checkbox to login

## 📝 Notes
- Focus on MVP functionality first
- Maintain code quality while moving fast
- Always follow CLAUDE.md guidelines
- Test critical paths thoroughly
- Document important decisions
- Keep security as top priority
- Optimize for developer experience

---
Last Updated: 2025-08-10
Next Review: End of current sprint

## 🎉 Recent Achievements (2025-08-10)
- Completed full RBAC implementation with role hierarchy
- Fixed case-insensitive role comparison
- Implemented permission-based access control
- Added role restrictions in UserManagement
- Optimized Sidebar component performance
- Fixed admin route access for SuperAdmin and Admin roles
- Added comprehensive null/undefined safety across entire frontend codebase
- Created safeAccess utility library for defensive programming
- Updated all Redux slices, hooks, components, and services with null checks
- Implemented comprehensive error boundary system with recovery actions
- Added error logger service with support for Sentry, LogRocket, and custom endpoints
- Integrated breadcrumb tracking and user context management
- Created feature-specific error boundaries for all major application areas
- Implemented comprehensive loading states across entire application
- Created LoadingContext for global loading state management
- Added SkeletonLoader components for better UX during data fetching
- Fixed all TypeScript errors related to loading states and imports -->


Skillswap Entwicklungsplan – basierend auf der Architektur‑Analyse
Diese Aufgabenliste konzentriert sich auf die wesentlichen Verbesserungen, die aus der Analyse der bestehenden Dienste hervorgegangen sind. Überflüssige oder weit in die Zukunft reichende Features wurden entfernt, um den Fokus auf die unmittelbaren Architektur‑ und Qualitätsverbesserungen zu richten.

1 Konsistenz und API‑Design
1.1 DTO‑Konsistenz bei Skills
 CreateSkillRequest und UpdateSkillRequest vereinheitlichen

Ziel: Die Request‑DTOs für das Erstellen und Aktualisieren eines Skills sollen identische Felder besitzen. Die Unterscheidung zwischen „angeboten“ und „gesucht“ wird ausschließlich über das Feld IsOffered abgebildet; das separate Feld IsWanted wird entfernt, da IsOffered == false bereits einen Suchenden beschreibt. Außerdem soll der Bewertende immer aus dem JWT ermittelt werden.

Umsetzung:

Entferne das Feld IsWanted aus Contracts.Skill.Requests.UpdateSkillRequest sowie aus allen Response‑DTOs (CreateSkillResponse, GetSkillDetailsResponse), und passe die Datenbank-Entität entsprechend an. Verwende ausschließlich IsOffered zur Kennzeichnung.

Überprüfe Kommentare in CreateSkillRequest: Entferne veraltete Hinweise auf IsWanted und IsRemote sowie Location, da Videocalls immer remote sind.

Entferne das Feld RatedUserId aus RateSkillRequest und ermittle den Bewertenden in den Command‑Handlern mittels ClaimsPrincipal.GetUserId().

Aktualisiere alle Handler, Mapper und Frontend‑Formulare entsprechend, sodass sie nur noch mit IsOffered arbeiten und keine IsWanted‑Felder mehr setzen können.

Schreibe Unit‑Tests, die sicherstellen, dass ein Skill mit IsOffered = false korrekt als Suchanfrage behandelt wird und dass das Entfernen von IsWanted, IsRemote und Location keine Regressionen verursacht.

1.2 Routen konsistent benennen
 Routen für Accept/Reject konsolidieren

Ziel: In allen Services sollen ähnliche Aktionen einheitlich über Pfade mit Ressourcen‑ID angesprochen werden. Beispielsweise sollte das Annehmen/Ablehnen einer Matchanfrage mit /requests/{requestId}/accept bzw. /requests/{requestId}/reject erfolgen statt ohne ID
raw.githubusercontent.com
.

Umsetzung:

Überprüfe alle Endpunkte in MatchmakingService und AppointmentService auf inkonsistente Accept/Reject‑Routen.

Passe die Minimal API‑Definitionen an (z.B. MapPost("/requests/{id}/accept")) und benenne Command/Query‑Records entsprechend um.

Aktualisiere das Frontend (API‑Service, Hooks) auf die neuen Pfade.

Führe Integrationstests aus, um sicherzustellen, dass alte Routen entfernt und neue Routen funktionieren.

1.3 Termin‑Rescheduling und Meeting‑Links
 Reschedule‑Endpoint für Termine implementieren

Ziel: Benutzer sollen Termine verschieben können. Dazu braucht es einen RescheduleAppointmentRequest und einen neuen Endpunkt.

Umsetzung:

Definiere in Contracts.Appointment.Requests einen RescheduleAppointmentRequest mit den Feldern AppointmentId, NewScheduledDate, NewDurationMinutes und optional Reason.

Füge im AppointmentService einen Endpunkt POST /appointments/{id}/reschedule hinzu, der den Request entgegennimmt, Konflikte prüft und eine Domain‑Methode Reschedule aufruft.

Publiziere nach erfolgreicher Verschiebung einen AppointmentRescheduledEvent mit alter und neuer Zeit.

Passe das Frontend an, um die Rescheduling‑Funktion anzubieten.

 Meeting‑Link nach Bestätigung generieren

Ziel: Der Meeting‑Link für virtuelle Termine soll generiert werden, sobald beide Teilnehmer den Termin akzeptiert haben.

Umsetzung:

Ergänze im AppointmentService einen EventHandler für AppointmentAcceptedEvent, der prüft, ob Status == Accepted für beide Parteien ist.

Wird der Termin virtuell geführt, wird ein Meeting‑Link generiert (z. B. über VideocallService) und in der Appointment‑Entität gespeichert.

Publiziere einen MeetingLinkGeneratedEvent zur Benachrichtigung der Teilnehmer.

Aktualisiere GetAppointmentDetailsResponse, damit der Link ausgegeben wird.

1.4 Zeitformate und Zeitfenster
 ISO‑8601 Zeitformat konsequent einsetzen

Ziel: Alle Zeitpunkte und Zeitfenster in Requests und Responses sollen als ISO‑8601‐konforme Strings (DateTimeOffset) übertragen werden. Dadurch werden Zeitzonen korrekt berücksichtigt und Missverständnisse vermieden.

Umsetzung:

Überprüfe alle Datums‑ und Zeitfelder in den Contracts (z. B. ScheduledDate, ScheduledUntil, PreferredSessionDuration, Zeitfenster in Match‑Requests) und ändere deren Typ auf DateTimeOffset.

Konfiguriere die JSON‑Serialisierung global (z. B. AddJsonOptions), sodass DateTimeOffset im "O"‑Format (ISO‑8601) serialisiert wird.

Passe Frontend‑Modelle und Formulare an, um ISO‑8601‑Strings zu senden und zu parsen.

Ergänze Unit‑Tests, die Datums‑ und Zeitangaben validieren.

 Zeitfenster für Match‑Anfragen hinzufügen und Cancel‑Endpoint

Ziel: Nutzer sollen bei der Erstellung einer Match‑Anfrage einen verfügbaren Zeitrahmen angeben können. Außerdem soll das Abbrechen einer Match‑Anfrage explizit unterstützt werden.

Umsetzung:

Ergänze CreateMatchRequest oder FindMatchRequest um die Felder AvailableFrom und AvailableTo vom Typ DateTimeOffset, die den Zeitraum definieren, in dem der Nutzer verfügbar ist.

Füge im MatchmakingService einen Endpunkt POST /matches/{id}/cancel hinzu. Definiere dazu einen CancelMatchRequest (mit MatchId und optional Reason) und implementiere die Command‑Handler, die einen MatchCancelledEvent publizieren.

Aktualisiere die Validierungslogik, sodass AvailableFrom vor AvailableTo liegt und der Zeitraum mindestens der minimalen Session‑Dauer entspricht.

Passe Frontend und Tests an, damit Zeiträume angegeben und Abbrüche angestoßen werden können.

2 Event‑Standardisierung
2.1 Versionierung und Correlation‑IDs
 EventVersion einführen und CorrelationId übernehmen

Ziel: Alle Integration‑Events sollen eine Versionsnummer und eine Correlation‑ID/Causation‑ID besitzen, damit Änderungen nachverfolgbar sind und Kette von Ereignissen rekonstruiert werden kann
GitHub
.

Umsetzung:

Erstelle in Events.Infrastructure eine Basisklasse VersionedEvent mit Eigenschaften Version, CorrelationId und CausationId.

Lasse alle bestehenden Integration‑Event‑Klassen von VersionedEvent erben und gib ihnen eine EventVersion‑Attribute (analog zum UserRegisteredEvent).

Ergänze in Command‑Handlern die Erzeugung von CorrelationId (z. B. via IHttpContextAccessor) und reiche sie an Events weiter.

Passe die Consumer in NotificationService und anderen Services an, um die neuen Felder zu lesen und für Logging/Tracing zu verwenden.

2.2 Event‑Namensgebung vereinheitlichen
 Konsistente Namenskonvention verwenden

Ziel: Events sollten nach dem Schema <Domain><Action>Event benannt werden (z. B. AppointmentAcceptedEvent, SkillCreatedEvent).

Umsetzung:

Überprüfe alle Events im Repository auf abweichende Namen und passe sie an.

Aktualisiere Publisher und Consumer entsprechend; Versioniere Events falls nötig.

Dokumentiere die Namenskonvention in der Entwickler‑Dokumentation.

3 Entflechtung des UserService
 Admin‑Endpoints in separaten Dienst auslagern

Ziel: Der UserService ist überladen (Auth, Profil, Favoriten, Blocken, Admin, Permissions, 2FA). Administrative Funktionen sollen in einen eigenen Microservice (z. B. AdminService) ausgelagert werden, um Zuständigkeiten zu trennen.

Umsetzung:

Erstelle ein neues Projekt AdminService mit eigenem Program.cs und Infrastructure‑Setup.

Verschiebe alle Endpunkte unter /users/management, /users/permissions/admin und /users/permissions/super-admin in den neuen Dienst.

Behalte den UserService für Authentifizierung, Profil, Favoriten und Blocking. Implementiere RBAC via API‑Gateway, sodass Admin‑Endpoints nur über AdminService erreichbar sind.

Aktualisiere das Gateway‑Routing (ocelot.json) entsprechend.

5 Shared Infrastructure
 Dynamische Konfiguration und Rate‑Limits pro Nutzer

Ziel: Viele Einstellungen (z. B. Rate‑Limiting, CORS‑Origins) sind derzeit hardcodiert. Die Konfiguration soll über Umgebungsvariablen oder ein zentrales Config‑System (z. B. Consul) geladen werden. Zudem sollen Rate‑Limits pro Nutzer eingeführt werden
raw.githubusercontent.com
.

Umsetzung:

Implementiere einen ConfigurationProvider in shared Infrastructure, der Settings aus Umgebungsvariablen oder einer Remote‑Config liest und regelmäßig aktualisiert.

Integriere das .NET Rate‑Limiting‑Middleware so, dass Limits pro API‑Key oder pro User‑ID angewendet werden; verwende Redis als Counter.

Passe CORS‑Konfiguration an, damit erlaubte Origins dynamisch geladen werden.

 Verbesserte Security Headers (CSP)

Ziel: Die Content‑Security‑Policy soll restriktiv definiert werden (z. B. nur bestimmte Domains und Skript‑Quellen zulassen).

Umsetzung:

Ergänze in der Middleware UseSecurityHeaders eine CSP‑Definition, die Skripte, Stylesheets und Bilder nur von vertrauenswürdigen Quellen lädt.

Teste die Anwendungen auf CSP‑Violations und passe sie entsprechend an.

 Test Utilities für RabbitMQ/Redis

Ziel: Für Integrationstests sollen Mock‑Implementierungen für RabbitMQ und Redis bereitgestellt werden.

Umsetzung:

Erstelle Interfaces für die verwendeten Caching‑ und Messaging‑Services und implementiere In‑Memory‑Varianten.

Integriere diese in die Testprojekte; verwende sie in Unit‑ und Integrationstests anstelle echter Infrastruktur.

6 Weitere Verbesserungen
6.1 Tag‑Limitierung bei Skills
 Maximale Tags pro Skill festlegen

Ziel: Unkontrolliertes Wachstum der Tag‑Liste soll verhindert werden.

Umsetzung:

Füge eine Validierung in CreateSkillRequest und UpdateSkillRequest ein, die die Anzahl der übergebenen Tags auf z. B. 5 beschränkt.

Dokumentiere diese Grenze in der API‑Beschreibung und zeige im Frontend eine entsprechende Fehlermeldung.

6.4 Remote‑ und Standortfelder entfernen
 IsRemote/Location aus Skills entfernen

Ziel: Da alle Sessions per Videokonferenz stattfinden, sind separate Felder wie IsRemoteAvailable oder Location in Skill‑Entitäten und ‑DTOs überflüssig. Die Entfernung vereinfacht das Datenmodell.

Umsetzung:

Identifiziere alle Felder in CreateSkillRequest, UpdateSkillRequest, CreateSkillResponse, GetSkillDetailsResponse und zugehörigen Domain‑Entitäten, die sich auf „remote“ oder „Standort“ beziehen (z. B. IsRemote, IsRemoteAvailable, Location).

Entferne diese Felder aus den DTO‑Definitionen und entfern sie aus den Entity‑Klassen. Passe Migrationsskripte an.

Überarbeite Business‑Logik, damit keine Standortabhängigkeit mehr vorhanden ist, und aktualisiere alle Mapper/Handlers.

Aktualisiere Frontend‑Formulare und Dokumentation, sodass keine Eingabe von Ort oder Remote‑Option erforderlich ist.

Füge Tests hinzu, um sicherzustellen, dass die entfernten Felder nirgends mehr auftauchen und dass die API weiterhin konsistent funktioniert.

7 Notification‑Service Verbesserungen
 RBAC für Benachrichtigungen klar trennen

Ziel: Administration von Benachrichtigungen (z. B. Bulk‑Versand, Template‑Management) soll nur Admins vorbehalten sein, während normale Nutzer lediglich ihre eigenen Benachrichtigungen abrufen und verwalten können.

Umsetzung:

Definiere im NotificationService separate Endpunkt‑Gruppen (z. B. /notifications/admin) mit einer RequireRole("Admin")‑Policy, während Nutzer‑Endpunkte (/notifications) nur Authentifizierung benötigen.

Verschiebe die Endpunkte für Template‑Verwaltung und Bulk‑Versand in die Admin‑Gruppe und ziehe dabei ein dediziertes NotificationManagementController in Betracht.

Aktualisiere die Gateway‑Konfiguration, um diese neuen Pfade abzubilden, und passe das Frontend an.

 Automatisches Retry für fehlgeschlagene Benachrichtigungen

Ziel: Versandfehler (z. B. bei Mail‑Server‑Ausfällen) sollen automatisch erneut versucht werden, bevor der Benutzer informiert wird oder der Vorgang als Fehlgeschlagen markiert wird.

Umsetzung:

Ergänze im NotificationService eine Retry‑Strategie (z. B. mittels Polly) beim Versand von E‑Mails, SMS und Push‑Nachrichten. Definiere maximale Anzahl und Intervall der Wiederholungen.

Speichere den Versandstatus und die Anzahl der Versuche in der Datenbank (z. B. NotificationAttempt‑Entität).

Füge einen Hintergrunddienst hinzu, der fehlgeschlagene Benachrichtigungen nach einem Backoff‑Schedule erneut sendet.

Aktualisiere die API‑Antworten, sodass der Versandstatus (Pending, Retrying, Failed) zurückgegeben wird.

 NotificationType‑Enum einführen

Ziel: Verschiedene Arten von Benachrichtigungen (E‑Mail, SMS, Push, In‑App) sollen klar typisiert werden, um das Routing und die Anzeige zu vereinfachen.

Umsetzung:

Lege in Contracts.Notification ein NotificationType‑Enum an (Email, Sms, Push, InApp usw.).

Ergänze das SendNotificationRequest um ein Feld Type: NotificationType. Validierung: Type darf nicht null sein.

Passe den NotificationDispatcher an, um anhand des Typs den richtigen Versandkanal zu wählen, und passe bestehende Consumer entsprechend an.

Aktualisiere die Swagger‑Dokumentation und das Frontend, sodass die Benutzer einen Typ auswählen können.

 Weitere Event‑Consumer und Benachrichtigungen hinzufügen

Ziel: Alle relevanten Ereignisse aus anderen Services sollen Benachrichtigungen auslösen. Der NotificationService verarbeitet derzeit nur Registrierungs‑, Sicherheits‑ und Match‑Events
raw.githubusercontent.com
. Ereignisse wie Termin‑Bestätigung oder -Absage, Rescheduling, Meeting‑Link‑Generierung oder neue/deaktivierte Skills fehlen.

Umsetzung:

Definiere neue Consumer (z. B. AppointmentAcceptedEventConsumer, AppointmentRescheduledEventConsumer, AppointmentCancelledEventConsumer, MeetingLinkGeneratedEventConsumer, SkillCreatedEventConsumer, SkillDeletedEventConsumer) und registriere sie in Program.cs über AddConsumer sowie entsprechende ReceiveEndpoints.

Implementiere die Consumer so, dass sie anhand der Benutzervorlieben (Email/SMS/Push) passende Benachrichtigungen versenden. Verwende das Orchestrator‑Pattern, um je nach NotificationType alle erforderlichen Kanäle zu bedienen.

Füge entsprechende Templated‑Nachrichten in Email‑, SMS‑ und Push‑Services hinzu (z. B. „Dein Termin wurde bestätigt“, „Termin wurde verschoben“, „Termin abgesagt“).

Ergänze Integrationstests, die das Publizieren dieser Ereignisse simulieren und die Auslösung von Benachrichtigungen prüfen.

 SMS‑basierte Telefonverifizierung implementieren

Ziel: Neben der E‑Mail‑Verifizierung soll auch die Telefonnummer per SMS verifiziert werden können. Dies erhöht die Sicherheit und ermöglicht SMS‑Benachrichtigungen.

Umsetzung:

Definiere im UserService einen Endpunkt POST /users/verify-phone und einen PhoneVerificationRequestedEvent. Der Endpunkt erzeugt einen Verifizierungscode und publiziert das Event.

Implementiere im NotificationService einen PhoneVerificationRequestedEventConsumer, der eine SMS mit dem Code sendet (über SmsService).

Erstelle im UserService einen Endpunkt POST /users/verify-phone/code zur Bestätigung des Codes sowie einen entsprechenden Command. Nach erfolgreicher Verifizierung publiziere einen PhoneVerifiedEvent.

Aktualisiere die Datenbank, um den Telefon‑Verifizierungsstatus pro Benutzer zu speichern, und erweitere die NotificationPreferences um ein Flag PhoneVerified.

Ergänze Unit‑Tests für den Verifizierungsvorgang.

 Push‑Benachrichtigungen verbessern

Ziel: Push‑Benachrichtigungen sollen zielgerichtet an registrierte Geräte gesendet werden können. Nutzer müssen ihre Gerätetokens verwalten können, und der NotificationService soll Topics (z. B. globale Ankündigungen) unterstützen.

Umsetzung:

Ergänze den UserService um Endpunkte zum Registrieren und Deregistrieren von Gerätetokens (POST /users/push-tokens, DELETE /users/push-tokens/{token}). Speichere Tokens mit Bezug zum Benutzer und Plattform (iOS, Android, Web).

Erweitere das NotificationPreferences‑Modell um eine Liste von Gerätetokens. Aktualisiere die Datenbank und die UpdateNotificationPreferencesCommand entsprechend.

Passe PushNotificationService an, um bei Sendungen die hinterlegten Tokens zu nutzen oder, für Broadcasts, Topics zu verwenden. Berücksichtige QuietHours aus den Präferenzen.

Implementiere Consumer, die bei wichtigen Ereignissen (z. B. neue Matches, Terminänderungen) automatische Push‑Benachrichtigungen auslösen.

Schreibe Tests für Token‑Registrierung und Push‑Versand.

 Benutzerpräferenzen und Mehrsprachigkeit ausbauen

Ziel: Der NotificationService unterstützt bereits Präferenzen wie EmailEnabled, SmsEnabled, PushEnabled sowie Language
raw.githubusercontent.com
. Diese sollen konsequent genutzt werden, um Inhalte in der gewünschten Sprache auszuliefern. Zudem soll die UI für Präferenzen erweitert werden.

Umsetzung:

Stelle sicher, dass Language in SendNotificationCommand und allen Consumern berücksichtigt wird: wähle anhand des Codes das passende Template (englisch, deutsch usw.). Hinterlege mehrsprachige Standardtexte in Email‑, SMS‑ und Push‑Templates.

Implementiere in Backend und Frontend eine i18n‑Bibliothek (z. B. IStringLocalizer in .NET, react-i18next im Frontend) zur Übersetzung statischer Texte und Fehlermeldungen.

Biete dem Benutzer im Frontend eine Auswahl seiner bevorzugten Sprache an; speichere diese in NotificationPreferences.Language und übergebe sie bei allen SendCommands.

Baue die Präferenzen‑API aus, sodass Kategorien wie Marketing, Sicherheitswarnungen, Erinnerungen und Digest‑Frequenzen klar konfigurierbar sind. Definiere dazu aussagekräftige Flags und validiere eingehende Daten.

Ergänze Unit‑Tests, die prüfen, dass bei verschiedenen Sprachpräferenzen die richtigen Templates verwendet werden.

 Cookie‑Einwilligung und Tracking implementieren

Ziel: Um DSGVO‑ und ePrivacy‑Richtlinien zu erfüllen, soll der Web‑Client eine Cookie‑Einwilligung (Consent Banner) anzeigen, die mehrsprachig ist und Nutzern erlaubt, optionale Cookies für Analytics/Marketing zu akzeptieren oder abzulehnen.

Umsetzung:

Im Frontend: integriere eine Consent‑Komponente, die beim ersten Besuch erscheint. Verwende die i18n‑Bibliothek für Mehrsprachigkeit und speichere die Entscheidung des Nutzers im Browser (z. B. localStorage oder cookie).

Implementiere einen Mechanismus zum Setzen und Lesen von Cookies mit unterschiedlichen Zwecken (necessary, analytics, marketing). Nur wenn der Nutzer zustimmt, werden optionale Cookies gesetzt.

Ergänze einen Endpunkt im Backend (GET /settings/cookie-policy), der die aktuelle Cookie‑Policy und Links zu Datenschutzrichtlinien liefert. Dieser Endpunkt kann für die Anzeige im Banner verwendet werden.

Aktualisiere die Datenschutzerklärung, um die Verwendung von Firebase Messaging und Twilio abzudecken.

8 Videocall‑Service Verbesserungen
 Automatisches Starten von Sessions

Ziel: Eine Videocall‑Session soll automatisch gestartet werden, sobald alle eingeladenen Teilnehmer beigetreten sind, ohne dass ein manueller Start erforderlich ist.

Umsetzung:

Ergänze im VideocallService eine Server‑seitige Überwachung, die beitretende Teilnehmer im SignalR‑Hub zählt.

Wenn alle eingeladenen User anwesend sind, sende über den Hub ein SessionStarted‑Signal und setze den Status im Backend auf Started.

Passe den Frontend‑Client an, um die Session automatisch zu öffnen und Kamerastreams zu initialisieren, sobald das SessionStarted‑Signal empfangen wird.

Schreibe Unit‑Tests für die Startlogik.

 Feedback separat posten

Ziel: Feedback zu einer Videokonferenz (z. B. Rating, Kommentar) soll in einem eigenen Endpunkt erfasst werden, damit Videocall‑Logs und Feedback sauber getrennt sind.

Umsetzung:

Definiere einen SubmitCallFeedbackRequest mit Feldern CallId, Rating (1‑5) und Comment.

Füge im VideocallService einen Endpunkt POST /calls/{id}/feedback hinzu, der das Feedback speichert und optional ein CallFeedbackSubmittedEvent publiziert.

Entferne Feedback‑Felder aus bestehenden Call‑Endpunkten und passe Datenbankmodelle an.

Aktualisiere das Frontend, sodass Feedback nach Ende des Calls eingegeben werden kann.

 Authentifizierung bei WebRTC‑Events prüfen

Ziel: SignalR‑Methoden (JoinRoom, LeaveRoom, SendOffer, SendAnswer, IceCandidate usw.) sollen nur von authentifizierten und autorisierten Teilnehmern eines Calls aufgerufen werden können.

Umsetzung:

Implementiere im VideocallHub eine Middleware oder Überschreibung von OnConnectedAsync, die das JWT des Nutzers validiert und prüft, ob dieser Teilnehmer des jeweiligen Calls ist.

Schlage eine Claims‑basierte Zugriffskontrolle vor (z. B. CanJoinCall, CanSendOffer), die als Policies im Backend hinterlegt werden.

Validierung: Verweigere Anfragen, wenn der Nutzer nicht Bestandteil des Calls ist oder keine Berechtigung besitzt. Informiere den Client via SignalR‑Fehlermeldung.

Ergänze Unit‑Tests und Integrationstests für Hub‑Methoden mit authentifizierten und nicht authentifizierten Nutzern.

9 OpenAPI‑Dokumentation und Testing
9.1 OpenAPI‑gestützte Route‑Generierung und API‑Versionierung
 OpenAPI‑gestützte Route‑Generierung und API‑Versionierung

Ziel: Die Routen des Gateways sollen automatisch aus den OpenAPI‑Spezifikationen der Services generiert werden; zudem soll eine Versionierung (z. B. /v1/) eingeführt werden
raw.githubusercontent.com
.

Umsetzung:

Stelle sicher, dass jeder Service seine OpenAPI‑Definition über Swagger v3 bereitstellt.

Schreibe ein Skript (z. B. Node.js), das die Spezifikationen einliest und daraus Ocelot‑Routen mit Upstream/Downstream‑Mapping erzeugt.

Füge einen Versionspräfix (/v1/...) in den Upstream‑Paths ein und plane die Unterstützung für zukünftige Versionen.

Entferne manuell gepflegte Routen aus ocelot.json und ersetze sie durch die generierten.

9.2 DTO‑Versionierung und OpenAPI
 OpenAPI‑Dokumentation vervollständigen

Ziel: Alle Services sollen eine vollständige Swagger‑Dokumentation mit Beispielen bereitstellen. Diese dient gleichzeitig als Vorlage für das Gateway.

Umsetzung:

Pflege XML‑Kommentare für alle DTOs und Endpunkte.

Füge Beispiele (Examples und SchemaFilters) für Requests/Responses hinzu.

Versioniere DTOs, falls Breaking Changes nötig werden; verwende hierfür z. B. Namespaces V1, V2.

9.3 Unit‑ und Integrationstests
 Tests für neu eingeführte Features schreiben

Ziel: Die obigen Änderungen müssen durch Tests abgesichert werden.

Umsetzung:

Schreibe Unit‑Tests für Reschedule‑Endpoint, Meeting‑Link‑Generierung und neue Event‑Felder.

Erstelle Integrationstests mit Testcontainers für RabbitMQ/Postgres, um die korrekte Event‑Verarbeitung zu verifizieren.

Stelle sicher, dass Tests in der CI ausgeführt werden.

Stand: 2025‑08‑10 – Diese Liste wurde auf Basis der aktuellen Analyse angepasst. Die entfernten Punkte aus der ursprünglichen TODO.md (z. B. KI‑Features, Blockchain, Kubernetes) werden zu einem späteren Zeitpunkt wieder aufgegriffen, sobald die grundlegenden Architektur‑Verbesserungen umgesetzt sind.