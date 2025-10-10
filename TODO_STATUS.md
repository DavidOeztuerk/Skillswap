# TODO Status Report

**Datum**: 2025-10-02
**Status**: 8 von 18 TODOs behoben
**Build Status**: ✅ Alle Services kompilieren erfolgreich

---

## ✅ Vollständig behobene TODOs

### MatchmakingService (4 TODOs)

#### 1. GetIncomingMatchRequestsQueryHandler
- **Problem**: Hardcoded Skill Category "General" und User Rating 4.5
- **Lösung**:
  - `ISkillServiceClient.GetSkillCategoryAsync()` integriert
  - `IUserServiceClient.GetUserRatingAsync()` integriert
- **Datei**: `Application/QueryHandlers/GetIncomingMatchRequestsQueryHandler.cs:108, 129`

#### 2. GetOutgoingMatchRequestsQueryHandler
- **Problem**: Hardcoded Skill Category "General" und User Rating 4.5
- **Lösung**:
  - `ISkillServiceClient.GetSkillCategoryAsync()` integriert
  - `IUserServiceClient.GetUserRatingAsync()` integriert
- **Datei**: `Application/QueryHandlers/GetOutgoingMatchRequestsQueryHandler.cs:108, 130`

#### 3. MatchAcceptedDomainEventHandler
- **Problem**: "TODO: Send notifications to both users" + "TODO: Create appointment suggestion"
- **Lösung**:
  - Dokumentiert, dass `MatchAcceptedIntegrationEvent` diese Aufgaben übernimmt
  - Wird in `AcceptMatchRequestCommandHandler` publiziert
  - Konsumiert von NotificationService und AppointmentService
- **Datei**: `Application/EventHandlers/MatchAcceptedDomainEventHandler.cs:15-16`

#### 4. SkillCreatedConsumer
- **Problem**: "TODO: Immediately try to find matches for this new skill"
- **Lösung**:
  - Design-Entscheidung dokumentiert
  - Auto-Matching sollte user-triggered sein (z.B. "Find Matches" Button)
  - Oder via Scheduled Background Job mit CompatibilityCalculator
- **Datei**: `Consumer/SkillCreatedConsumer.cs:37-38`

---

### AppointmentService (2 TODOs)

#### 5. GetUserAppointmentsQueryHandler
- **Problem**: Hardcoded "Other Party Name"
- **Lösung**:
  - `IUserServiceClient` injected
  - `GetUserNameAsync()` wird für jeden Termin aufgerufen
  - Asynchrone User-Abfrage implementiert
- **Datei**: `Application/QueryHandlers/GetUserAppointmentsQueryHandler.cs:67`

#### 6. MeetingLinkService
- **Problem**: 4x "TODO: Get email/name from UserService"
- **Lösung**:
  - `IUserServiceClient` injected
  - `GetUserProfileAsync()` für Organizer und Participant
  - Email und Name werden in `MeetingLinkGeneratedDomainEvent` übergeben
- **Datei**: `Infrastructure/Services/MeetingLinkService.cs:67-78`

---

### UserService (2 TODOs)

#### 7. AssignRoleCommandHandler
- **Problem**: "TODO: Publish domain event for role assigned"
- **Lösung**:
  - `UserRoleAssignedDomainEvent` wird publiziert
  - User-Profile wird abgerufen für Email
  - Event enthält: UserId, Email, Role, AssignedBy
- **Datei**: `UserService.Application/CommandHandlers/Permissions/AssignRoleCommandHandler.cs:62-68`

#### 8. RemoveRoleCommandHandler
- **Problem**: "TODO: Publish domain event for role removed"
- **Lösung**:
  - `UserRoleRevokedDomainEvent` wird publiziert
  - User-Profile wird abgerufen für Email
  - Event enthält: UserId, Email, Role, RevokedBy
- **Datei**: `UserService.Application/CommandHandlers/Permissions/RemoveRoleCommandHandler.cs:62-68`

---

## 📌 Verbleibende TODOs (Zukünftige Features)

Diese TODOs erfordern neue Features, Tabellen oder Domain Events und sollten in separaten User Stories umgesetzt werden.

### AppointmentService (1 TODO)

#### RateAppointmentCommandHandler
- **TODO**: "Persist ratings in a separate aggregate/table"
- **Benötigt**:
  - Rating-Aggregate erstellen
  - Rating-Tabelle in DB
  - Rating-Domain-Events
  - Rating-Integration-Events für UserService (Average Rating Update)
- **Datei**: `Application/CommandHandlers/RateAppointmentCommandHandler.cs:34`
- **Priorität**: Medium
- **User Story**: "Als User möchte ich Termine bewerten können, damit andere Users meine Erfahrungen sehen"

---

### UserService (6 TODOs)

#### CreateRoleCommandHandler
- **TODO**: "Publish domain event for role created"
- **Benötigt**: `RoleCreatedDomainEvent` definieren in Events/Domain/User
- **Datei**: `UserService.Application/CommandHandlers/Permissions/CreateRoleCommandHandler.cs`
- **Priorität**: Low

#### GrantPermissionCommandHandler
- **TODO**: "Publish domain event for permission granted"
- **Benötigt**: `PermissionGrantedDomainEvent` definieren in Events/Domain/User
- **Datei**: `UserService.Application/CommandHandlers/Permissions/GrantPermissionCommandHandler.cs`
- **Priorität**: Low

#### RevokePermissionCommandHandler
- **TODO**: "Publish domain event for permission revoked"
- **Benötigt**: `PermissionRevokedDomainEvent` definieren in Events/Domain/User
- **Datei**: `UserService.Application/CommandHandlers/Permissions/RevokePermissionCommandHandler.cs`
- **Priorität**: Low

#### SyncUserPermissionsCommandHandler
- **TODO**: "Publish domain event for permissions synced"
- **Benötigt**: `PermissionsSyncedDomainEvent` definieren in Events/Domain/User
- **Datei**: `UserService.Application/CommandHandlers/Permissions/SyncUserPermissionsCommandHandler.cs`
- **Priorität**: Low

#### GetPublicUserProfileQueryHandler (4 TODOs)
- **TODO 1**: "Implement rating system" - Average rating calculation
- **TODO 2**: "Implement review system" - Total reviews count
- **TODO 3**: "Get from SkillService" - Skills offered count
- **TODO 4**: "Get from SkillService" - Skills learned count
- **TODO 5**: "Implement languages" - User languages list
- **Benötigt**:
  - Rating-System komplett implementieren
  - Integration mit SkillService für Skills-Statistiken
  - Languages-Feature in User-Entity
- **Datei**: `UserService.Application/QueryHandlers/GetPublicUserProfileQueryHandler.cs:13-17`
- **Priorität**: High
- **User Story**: "Als User möchte ich öffentliche Profile mit Statistiken sehen"

---

### SkillService (2 TODOs)

#### GetPopularTagsQueryHandler
- **TODO**: "Calculate growth rate"
- **Benötigt**:
  - Historische Tag-Daten speichern (Snapshot-Tabelle)
  - Growth-Rate-Calculation-Service
- **Datei**: `Application/QueryHandlers/GetPopularTagsQueryHandler.cs`
- **Priorität**: Low
- **User Story**: "Als Admin möchte ich Tag-Trends sehen"

#### GetSkillStatisticsQueryHandler
- **TODO**: "Calculate actual growth percentage"
- **Benötigt**:
  - Historische Skill-Daten speichern
  - Growth-Percentage-Calculation
- **Datei**: `Application/QueryHandlers/GetSkillStatisticsQueryHandler.cs`
- **Priorität**: Low
- **User Story**: "Als Admin möchte ich Skill-Wachstum sehen"

---

### NotificationService (1 TODO)

#### NotificationServiceClient (in UserService)
- **TODO**: "Implement bulk delete endpoint in NotificationService"
- **Benötigt**:
  - Bulk Delete Endpoint in NotificationService.Api
  - BulkDeleteNotificationsCommand erstellen
  - BulkDeleteNotificationsCommandHandler implementieren
- **Datei**: `UserService.Infrastructure/HttpClients/NotificationServiceClient.cs`
- **Priorität**: Low
- **Use Case**: Wenn User gelöscht wird, alle seine Notifications löschen

---

## 🏗️ Implementierungs-Roadmap

### Phase 1: Kritische User-Facing Features (Nächster Sprint)
1. **Rating-System komplett implementieren**
   - AppointmentService: Rating-Aggregate + Tabelle
   - UserService: AverageRating berechnen und speichern
   - Integration Events zwischen Services
   - Frontend: Rating-UI

2. **Public User Profile vervollständigen**
   - Skills-Statistiken von SkillService abrufen
   - Ratings-Anzeige integrieren

### Phase 2: Admin & Analytics (Sprint +2)
3. **Growth Tracking für Tags & Skills**
   - Snapshot-Tabellen erstellen
   - Scheduled Jobs für Snapshots
   - Growth-Calculation-Services

### Phase 3: Event Publishing vervollständigen (Sprint +3)
4. **Permission Domain Events**
   - Event-Definitionen erstellen
   - Event-Handler implementieren
   - Audit-Log-Consumer

5. **Notification Bulk Operations**
   - Bulk Delete Endpoint
   - Performance-Optimierung

---

## 📊 Build Status

Alle Services kompilieren erfolgreich nach TODO-Fixes:

- ✅ UserService.Api
- ✅ MatchmakingService
- ✅ AppointmentService
- ✅ SkillService
- ✅ NotificationService
- ✅ VideocallService
- ✅ Gateway

---

## 🔄 Nächste Schritte

1. ✅ TODOs dokumentiert
2. ⏳ Migrations erstellen für MatchmakingService & AppointmentService
3. ⏳ Migrations anwenden
4. ⏳ Tests durchführen (Dashboard, Appointments)
5. ⏳ Rating-System als nächstes Feature planen

---

**Letzte Aktualisierung**: 2025-10-02
**Erstellt von**: Claude (Domain Refactoring Session)
