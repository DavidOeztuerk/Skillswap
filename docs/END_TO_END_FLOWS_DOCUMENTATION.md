# End-to-End Flows Dokumentation - Skillswap

**Erstellt am**: 2025-11-02
**Analysierte Flows**: 5 CRUD-Operationen komplett durchanalysiert

---

## 📋 Inhaltsverzeichnis

1. [Flow 1: Create Match Request](#flow-1-create-match-request)
2. [Flow 2: Accept Match → Create Appointments](#flow-2-accept-match--create-appointments)
3. [Flow 3: Create Skill](#flow-3-create-skill)
4. [Flow 4: Update Profile](#flow-4-update-profile)
5. [Flow 5: Create Appointment (Manuell)](#flow-5-create-appointment-manuell)
6. [Cache Invalidation Summary](#cache-invalidation-summary)
7. [Event-Driven Architecture Overview](#event-driven-architecture-overview)

---

## Flow 1: Create Match Request

### Beschreibung
User erstellt eine Match-Anfrage für einen Skill von einem anderen User.

### Frontend Flow

#### 1. **UI: Button Click**
- **File**: `src/client/src/pages/skills/SkillDetailPage.tsx:330-359`
- **User Action**: Klick auf "Match-Anfrage senden" Button
- **Form Daten**:
  ```typescript
  const command: CreateMatchRequest = {
      skillId: selectedSkill.id,
      targetUserId: selectedSkill.userId,
      message: data.message,
      isSkillExchange: data.isSkillExchange,
      exchangeSkillId: data.exchangeSkillId,
      isMonetary: data.isMonetary,
      offeredAmount: data.offeredAmount,
      currency: data.currency,
      totalSessions: data.totalSessions,
      sessionDurationMinutes: data.sessionDurationMinutes,
      preferredDays: data.preferredDays,
      preferredTimes: data.preferredTimes
  };
  ```

#### 2. **Hook: useMatchmaking**
- **File**: `src/client/src/hooks/useMatchmaking.ts:106-108`
- **Function**: `sendMatchRequest(command)`
- **Dispatches**: `createMatchRequest` thunk

#### 3. **Thunk: createMatchRequest**
- **File**: `src/client/src/features/matchmaking/matchmakingThunks.ts:11-16`
- **Async Action**: Calls `matchmakingService.createMatchRequest(req)`

#### 4. **API Service**
- **File**: `src/client/src/api/services/matchmakingService.ts`
- **Method**: `createMatchRequest(request)`
- **HTTP Call**: `apiClient.post<DirectMatchRequestResponse>(MATCHMAKING_ENDPOINTS.CREATE_REQUEST, request)`

#### 5. **API Client**
- **Method**: `POST /api/matches/requests`
- **Authentication**: Bearer Token (automatically added)

---

### Gateway Routing

#### Gateway Configuration
- **File**: `src/services/Gateway/ocelot.json`
- **Upstream**: `POST /api/matches/requests`
- **Downstream**: `http://localhost:5003/matches/requests`
- **Service**: MatchmakingService (Port 5003)
- **Auth**: Bearer Token required

---

### Backend Flow

#### 6. **Minimal API Endpoint**
- **File**: `src/services/MatchmakingService/MatchmakingService.Api/Extensions/MatchmakingControllerExtensions.cs:80-99`
- **Endpoint**: `POST /matches/requests`
- **Handler**: `CreateMatchRequest`
- **Steps**:
  1. Extract `userId` from JWT ClaimsPrincipal
  2. Validate user is authenticated
  3. Create `CreateMatchRequestCommand`
  4. Send command via MediatR: `mediator.Send(command)`

#### 7. **Command**
- **File**: `src/services/MatchmakingService/MatchmakingService.Application/Commands/CreateMatchRequestCommand.cs`
- **Implements**: `ICommand<DirectMatchRequestResponse>`, `IAuditableCommand`, `ICacheInvalidatingCommand`
- **Cache Invalidation Patterns**:
  ```csharp
  public string[] InvalidationPatterns => new[]
  {
      "outgoing-match-requests:*",
      "incoming-match-requests:*",
      "match-statistics"
  };
  ```

#### 8. **FluentValidation**
- **Validator**: `CreateMatchRequestCommandValidator`
- **Rules**:
  - SkillId required
  - TargetUserId required and not self
  - Message: 10-500 characters
  - Session duration: 15-480 minutes
  - Total sessions: 1-100
  - If exchange: ExchangeSkillId required
  - If monetary: OfferedAmount > 0, Currency required

#### 9. **Command Handler**
- **File**: `src/services/MatchmakingService/MatchmakingService.Application/CommandHandlers/CreateMatchRequestCommandHandler.cs`
- **Process**:
  1. **Email Verification Check** (lines 60-68):
     ```csharp
     var userProfile = await _userServiceClient.GetUserProfileAsync(request.UserId);
     if (userProfile?.IsEmailVerified != true)
         return Error("Email must be verified");
     ```
  2. **Duplicate Request Check** (lines 71-86):
     ```csharp
     var existingRequest = await _unitOfWork.MatchRequests.GetPendingRequestAsync(
         request.UserId, request.TargetUserId, request.SkillId);
     if (existingRequest != null)
         return Error("Pending request already exists");
     ```
  3. **Generate ThreadId** (lines 88-91):
     ```csharp
     var threadId = $"{request.UserId}_{request.TargetUserId}_{request.SkillId}_{Guid.NewGuid().ToString("N")[..8]}";
     ```
  4. **Create MatchRequest Entity** (lines 93-119)
  5. **Save to Database** (lines 121-122)
  6. **Publish Domain Event** (lines 125-139):
     ```csharp
     await _eventPublisher.Publish(
         new DirectMatchRequestCreatedDomainEvent(matchRequest.Id, ...));
     ```
  7. **Manual Cache Invalidation** (lines 142-164) - ⚠️ **REDUNDANT**, da `CacheInvalidationBehavior` dies automatisch macht
  8. **Publish Integration Event** (lines 175-198):
     ```csharp
     await _publishEndpoint.Publish(
         new MatchRequestCreatedIntegrationEvent(...));
     ```

---

### Event-Driven Side Effects

#### Domain Event: DirectMatchRequestCreatedDomainEvent
- **Purpose**: Internal domain event for event sourcing
- **No handlers currently active**

#### Integration Event: MatchRequestCreatedIntegrationEvent
- **Consumer**: `MatchRequestCreatedIntegrationEventConsumer` (NotificationService)
- **File**: `src/services/NotificationService/NotificationService.Infrastructure/Consumers/MatchRequestCreatedIntegrationEventConsumer.cs:23-79`
- **Actions**:
  1. Fetch requester and target user emails via `UserServiceClient`
  2. Create `Notification` entity in database
  3. Send email via `NotificationOrchestrator.SendEmailAsync()`
  4. Send SignalR push notification via `NotificationHub`

---

### Cache Invalidation

#### Automatic (via CacheInvalidationBehavior)
- **Patterns from Command**:
  - `outgoing-match-requests:*` - Invalidate all outgoing requests cache
  - `incoming-match-requests:*` - Invalidate all incoming requests cache
  - `match-statistics` - Invalidate match statistics

#### Manual (redundant in Handler)
- Handler manually invalidates same patterns (lines 142-164)
- ⚠️ **Code Smell**: Duplicate cache invalidation

---

### Summary

| Layer | Component | File |
|-------|-----------|------|
| **Frontend** | Button Click | `SkillDetailPage.tsx:330-359` |
| | Hook | `useMatchmaking.ts:106-108` |
| | Thunk | `matchmakingThunks.ts:11-16` |
| | API Service | `matchmakingService.ts` |
| **Gateway** | Route | `ocelot.json` POST /api/matches/requests → Port 5003 |
| **Backend** | Endpoint | `MatchmakingControllerExtensions.cs:80-99` |
| | Command | `CreateMatchRequestCommand.cs` |
| | Handler | `CreateMatchRequestCommandHandler.cs` |
| | Events | MatchRequestCreatedIntegrationEvent → NotificationService |

---

## Flow 2: Accept Match → Create Appointments

### Beschreibung
User akzeptiert eine eingehende Match-Anfrage. Das System erstellt automatisch die komplette Session-Hierarchie (Connection → SessionSeries → SessionAppointments) mit Meeting-Links.

### Frontend Flow

#### 1. **UI: Button Click**
- **File**: `src/client/src/pages/matchmaking/MatchRequestsOverviewPage.tsx:228-239`
- **User Action**: Klick auf "Annehmen" Button bei eingehender Match-Anfrage
- **Conditional Rendering**: Button nur sichtbar wenn `request.status === 'pending' && request.type === 'incoming'`

#### 2. **Hook: useMatchmaking**
- **File**: `src/client/src/hooks/useMatchmaking.ts:110-112`
- **Function**: `acceptMatchRequest(requestId, request)`
- **Dispatches**: `acceptMatchRequest` thunk

#### 3. **Thunk: acceptMatchRequest**
- **File**: `src/client/src/features/matchmaking/matchmakingThunks.ts:53-58`
- **Async Action**:
  ```typescript
  async ({ requestId, request }, { rejectWithValue }) => {
      const res = await matchmakingService.acceptMatchRequest(requestId, request);
      return isSuccessResponse(res) ? res : rejectWithValue(res);
  }
  ```

#### 4. **API Service**
- **File**: `src/client/src/api/services/matchmakingService.ts`
- **Method**: `acceptMatchRequest(requestId, request)`
- **HTTP Call**: `apiClient.post(MATCHMAKING_ENDPOINTS.ACCEPT_REQUEST(requestId), request)`

#### 5. **API Client**
- **Method**: `POST /api/matches/requests/{requestId}/accept`
- **Authentication**: Bearer Token

---

### Gateway Routing

#### Gateway Configuration
- **Upstream**: `POST /api/matches/requests/{requestId}/accept`
- **Downstream**: `http://localhost:5003/matches/requests/{requestId}/accept`
- **Service**: MatchmakingService (Port 5003)

---

### Backend Flow - MatchmakingService

#### 6. **Minimal API Endpoint**
- **File**: `MatchmakingControllerExtensions.cs`
- **Endpoint**: `POST /matches/requests/{requestId}/accept`
- **Creates**: `AcceptMatchRequestCommand`

#### 7. **Command Handler: AcceptMatchRequestCommandHandler**
- **File**: `src/services/MatchmakingService/MatchmakingService.Application/CommandHandlers/AcceptMatchRequestCommandHandler.cs:35-144`

##### Process:
1. **Fetch MatchRequest** (lines 40-41):
   ```csharp
   var matchRequest = await _unitOfWork.MatchRequests.Query
       .FirstOrDefaultAsync(mr => mr.Id == request.RequestId);
   ```

2. **Validate Status** (lines 48-51):
   ```csharp
   if (matchRequest.Status.ToLower() != "pending")
       return Error("Match request is no longer pending");
   ```

3. **Accept Request** (line 54):
   ```csharp
   matchRequest.Accept(request.ResponseMessage);
   ```

4. **Create Match Entity** (lines 57-58):
   ```csharp
   var match = Match.CreateFromAcceptedRequest(matchRequest);
   ```

5. **Save to Database** (lines 60-61)

6. **Cache Invalidation** (lines 63-95):
   ```csharp
   await _cacheService.RemoveByPatternAsync($"matchrequests:incoming:{matchRequest.TargetUserId}:*");
   await _cacheService.RemoveByPatternAsync($"matchrequests:outgoing:{matchRequest.RequesterId}:*");
   await _cacheService.RemoveByPatternAsync($"matches:user:{matchRequest.TargetUserId}:*");
   await _cacheService.RemoveByPatternAsync($"matches:user:{matchRequest.RequesterId}:*");
   ```

7. **Publish Domain Event** (lines 98-105):
   ```csharp
   await _eventPublisher.Publish(new DirectMatchRequestAcceptedDomainEvent(...));
   ```

8. **Fetch User/Skill Names** (lines 107-113) - Cross-service calls via ServiceCommunicationManager

9. **Publish Integration Event** (lines 116-139):
   ```csharp
   await _publishEndpoint.Publish(new MatchAcceptedIntegrationEvent(
       matchId: match.Id,
       requestId: matchRequest.Id,
       requesterId: matchRequest.RequesterId,
       targetUserId: matchRequest.TargetUserId,
       skillId: matchRequest.SkillId,
       skillName: skillName,
       isSkillExchange: matchRequest.IsSkillExchange,
       exchangeSkillId: matchRequest.ExchangeSkillId,
       exchangeSkillName: exchangeSkillName,
       isMonetary: matchRequest.IsMonetaryOffer,
       agreedAmount: matchRequest.OfferedAmount,
       currency: matchRequest.Currency,
       sessionDurationMinutes: matchRequest.SessionDurationMinutes ?? 60,
       totalSessions: matchRequest.TotalSessions ?? 1,
       preferredDays: matchRequest.PreferredDays?.ToArray() ?? Array.Empty<string>(),
       preferredTimes: matchRequest.PreferredTimes?.ToArray() ?? Array.Empty<string>(),
       threadId: matchRequest.ThreadId ?? "",
       acceptedAt: match.AcceptedAt ?? DateTime.UtcNow
   ));
   ```

---

### Backend Flow - AppointmentService

#### Integration Event Consumer: MatchAcceptedIntegrationEventHandler

- **File**: `src/services/AppointmentService/AppointmentService.Application/EventHandlers/MatchAcceptedIntegrationEventHandler.cs:36-164`
- **Trigger**: RabbitMQ message `MatchAcceptedIntegrationEvent`

##### Process:

1. **Call SessionOrchestrationService** (lines 49-61):
   ```csharp
   var connection = await _sessionOrchestrationService.CreateSessionHierarchyFromMatchAsync(
       matchRequestId: message.MatchId,
       requesterId: message.RequesterId,
       targetUserId: message.TargetUserId,
       skillId: message.SkillId,
       isSkillExchange: message.IsSkillExchange,
       exchangeSkillId: message.ExchangeSkillId,
       isMonetary: message.IsMonetary,
       offeredAmount: message.AgreedAmount,
       currency: message.Currency,
       totalSessions: message.TotalSessions,
       sessionDurationMinutes: message.SessionDurationMinutes
   );
   ```

2. **SessionOrchestrationService.CreateSessionHierarchyFromMatchAsync**:
   - **File**: `src/services/AppointmentService/AppointmentService.Infrastructure/Services/SessionOrchestrationService.cs:36-150`

   **Creates Complete Session Hierarchy**:

   a. **Create Connection Entity** (lines 69-81):
   ```csharp
   var connection = Connection.Create(
       matchRequestId: matchRequestId,
       requesterId: requesterId,
       targetUserId: targetUserId,
       connectionType: connectionType, // SkillExchange | Payment | Free
       skillId: skillId,
       exchangeSkillId: exchangeSkillId,
       paymentRatePerHour: offeredAmount,
       currency: currency
   );
   ```

   b. **Create SessionSeries** (lines 86-136):
   - **If Skill Exchange**: Creates **2 series** (one for each skill direction)
     - Series 1: Requester teaches Primary Skill → Target User learns
     - Series 2: Target User teaches Exchange Skill → Requester learns
   - **If Payment/Free**: Creates **1 series**

   c. **Create SessionAppointments** (internal method `CreateSessionSeriesInternalAsync`):
   - Each series gets N SessionAppointments (based on totalSessions)
   - Each appointment gets a **Meeting Link** via `MeetingLinkService`

   d. **Publish Domain Event** (lines 141-148):
   ```csharp
   await _eventPublisher.Publish(new ConnectionCreatedEvent(...));
   ```

3. **Cache Invalidation** (lines 68-93):
   ```csharp
   await _cacheService.RemoveByPatternAsync($"user-appointments:{message.RequesterId}:*");
   await _cacheService.RemoveByPatternAsync($"user-appointments:{message.TargetUserId}:*");
   await _cacheService.RemoveByPatternAsync($"appointment-details:*");
   ```

4. **Fetch User Profiles** (lines 96-102) - Cross-service calls

5. **Collect All Created Appointments** (lines 104-127):
   ```csharp
   foreach (var series in connection.SessionSeries)
   {
       foreach (var appointment in series.SessionAppointments)
       {
           allAppointments.Add(new AppointmentSummary(...));
       }
   }
   ```

6. **Publish Integration Event for NotificationService** (lines 130-146):
   ```csharp
   await _publishEndpoint.Publish(new AppointmentsCreatedIntegrationEvent(
       message.MatchId,
       message.RequesterId,
       organizerProfile?.Email ?? "",
       $"{organizerProfile?.FirstName} {organizerProfile?.LastName}".Trim(),
       message.TargetUserId,
       participantProfile?.Email ?? "",
       $"{participantProfile?.FirstName} {participantProfile?.LastName}".Trim(),
       message.SkillName,
       message.IsSkillExchange,
       message.ExchangeSkillName,
       message.IsMonetary,
       message.AgreedAmount,
       message.Currency,
       allAppointments.ToArray(),
       DateTime.UtcNow
   ));
   ```

---

### Backend Flow - NotificationService

#### Integration Event Consumer: AppointmentsCreatedIntegrationEventConsumer

- **File**: `src/services/NotificationService/NotificationService.Infrastructure/Consumers/AppointmentsCreatedIntegrationEventConsumer.cs:36-434`
- **Trigger**: RabbitMQ message `AppointmentsCreatedIntegrationEvent`

##### Process:

1. **Send Emails to BOTH Users** (lines 46-49):
   ```csharp
   await Task.WhenAll(
       SendAppointmentsEmailAsync(message, toOrganizer: true),
       SendAppointmentsEmailAsync(message, toOrganizer: false)
   );
   ```

2. **Email Content** (lines 70-113):
   - **Subject**: "🎉 Deine {N} Sessions mit {PartnerName} sind bereit!"
   - **HTML Email** (lines 125-379):
     - Session overview with skill badges
     - All appointment details (Datum, Zeit, Dauer)
     - Meeting links for each session
     - Teacher role indicators for skill exchange
     - Important notes (links active 5min before, valid 24h after)
     - Dashboard CTA button

3. **Send SignalR Push Notifications** (lines 56-57):
   ```csharp
   await SendSignalRNotificationAsync(message, message.OrganizerUserId);
   await SendSignalRNotificationAsync(message, message.ParticipantUserId);
   ```

4. **SignalR Notification Payload** (lines 390-414):
   ```csharp
   await NotificationHub.SendNewAppointmentsToUser(
       _notificationHub,
       userId,
       appointmentsData // Array of appointments with meeting links
   );
   ```

---

### Data Flow Summary

```
MatchmakingService:
  AcceptMatchRequestCommand
  ↓
  Match.CreateFromAcceptedRequest()
  ↓
  Publish: MatchAcceptedIntegrationEvent

AppointmentService Consumer:
  MatchAcceptedIntegrationEvent
  ↓
  SessionOrchestrationService.CreateSessionHierarchyFromMatchAsync()
  ↓
  Creates:
    - 1 Connection
    - 1-2 SessionSeries (depending on exchange)
    - N SessionAppointments (with meeting links)
  ↓
  Publish: AppointmentsCreatedIntegrationEvent

NotificationService Consumer:
  AppointmentsCreatedIntegrationEvent
  ↓
  Send Emails (Organizer + Participant)
  ↓
  Send SignalR Push Notifications
```

---

### Cache Invalidation

#### MatchmakingService
- `matchrequests:incoming:{targetUserId}:*`
- `matchrequests:outgoing:{requesterId}:*`
- `matches:user:{targetUserId}:*`
- `matches:user:{requesterId}:*`

#### AppointmentService
- `user-appointments:{requesterId}:*`
- `user-appointments:{targetUserId}:*`
- `appointment-details:*`

---

### Summary

| Service | Component | Action |
|---------|-----------|--------|
| **MatchmakingService** | AcceptMatchRequestCommandHandler | Accept request, create Match, publish event |
| **AppointmentService** | MatchAcceptedIntegrationEventHandler | Create Connection → SessionSeries → SessionAppointments |
| | SessionOrchestrationService | Orchestrate complete session hierarchy |
| **NotificationService** | AppointmentsCreatedIntegrationEventConsumer | Send emails + push notifications |

**Result**: User receives email with all N session appointments, each with meeting link, and real-time notification.

---

## Flow 3: Create Skill

### Beschreibung
User erstellt einen neuen Skill in seinem Profil.

### Frontend Flow

#### 1. **UI: Form Submission**
- **File**: `src/client/src/components/skills/SkillForm.tsx:146-160`
- **User Action**: Füllt SkillForm aus und klickt "Erstellen"
- **Form Validation**: Client-side validation via React Hook Form + Zod
- **Form Data**:
  ```typescript
  {
      name: string,
      description: string,
      categoryId: string,
      proficiencyLevelId: string,
      isOffered: boolean,
      tags?: string[]
  }
  ```

#### 2. **Hook: useSkills**
- **File**: `src/client/src/hooks/useSkills.ts:146-148`
- **Function**: `createSkill(skillData)`
- **Dispatches**: `createSkill` thunk

#### 3. **Thunk: createSkill**
- **File**: `src/client/src/features/skills/thunks/skillsThunks.ts:164-209`
- **Process**:
  1. Calls `skillService.createSkill(skillData)`
  2. Maps `CreateSkillResponse` to `Skill` model
  3. Returns transformed `Skill` object

#### 4. **API Service**
- **File**: `src/client/src/api/services/skillsService.ts:65-70`
- **Method**: `createSkill(skillData)`
- **HTTP Call**: `apiClient.post<CreateSkillResponse>(SKILL_ENDPOINTS.CREATE_SKILL, skillData)`

#### 5. **API Client**
- **Method**: `POST /api/skills`
- **Authentication**: Bearer Token

---

### Gateway Routing

#### Gateway Configuration
- **Upstream**: `POST /api/skills`
- **Downstream**: `http://localhost:5002/skills`
- **Service**: SkillService (Port 5002)

---

### Backend Flow

#### 6. **Minimal API Endpoint**
- **File**: `src/services/SkillService/SkillService.Api/Extensions/SkillControllerExtensions.cs:49-57`
- **Endpoint**: `POST /skills`
- **Handler**: `CreateNewSkill` (lines 139-158)
- **Process**:
  1. Extract `userId` from JWT
  2. Create `CreateSkillCommand` with user input
  3. Set `command.UserId = userId`
  4. Send via MediatR: `mediator.SendCommand(command)`

#### 7. **Command**
- **File**: `src/services/SkillService/SkillService.Application/Commands/CreateSkillCommand.cs`
- **Implements**: `ICommand<CreateSkillResponse>`, `IAuditableCommand`, `ICacheInvalidatingCommand`
- **Properties**:
  ```csharp
  public record CreateSkillCommand(
      string Name,
      string Description,
      string CategoryId,
      string ProficiencyLevelId,
      List<string> Tags,
      bool IsOffered,
      int? AvailableHours = null,
      int? PreferredSessionDuration = 60)
  ```

- **Cache Invalidation Patterns**:
  ```csharp
  public string[] InvalidationPatterns => new[]
  {
      "skills-search:*",      // All search queries
      "user-skills:*",        // All user skill lists
      "skill-categories:*"    // Category statistics might change
  };
  ```

#### 8. **FluentValidation**
- **Validator**: `CreateSkillCommandValidator`
- **Rules**:
  - Name: 3-100 characters, alphanumeric + special chars
  - Description: 10-2000 characters
  - CategoryId: required
  - ProficiencyLevelId: required
  - Tags: max 10 tags, each max 50 characters
  - AvailableHours: 0-480 (optional)
  - PreferredSessionDuration: 0-480 (optional)

#### 9. **Command Handler**
- **File**: `src/services/SkillService/SkillService.Application/CommandHandlers/CreateSkillCommandHandler.cs:19-100`

##### Process:
1. **Validate UserId** (lines 23-26):
   ```csharp
   if (request.UserId == null)
       throw new ArgumentNullException(nameof(request));
   ```

2. **Validate Category Exists** (line 29):
   ```csharp
   var category = await _unitOfWork.SkillCategories.GetByIdAsync(request.CategoryId)
       ?? throw new ResourceNotFoundException("SkillCategory", request.CategoryId);
   ```

3. **Validate ProficiencyLevel Exists** (line 32):
   ```csharp
   var proficiencyLevel = await _unitOfWork.ProficiencyLevels.GetByIdAsync(request.ProficiencyLevelId)
       ?? throw new ResourceNotFoundException("ProficiencyLevel", request.ProficiencyLevelId);
   ```

4. **Check for Duplicate Skill** (lines 35-44):
   ```csharp
   var existingSkill = await _unitOfWork.Skills.GetByNameAndUserIdAsync(
       request.Name.Trim(), request.UserId);

   if (existingSkill != null)
       throw new ResourceAlreadyExistsException("Skill", "Name", request.Name,
           "You already have a similar skill.");
   ```

5. **Create Skill Entity** (lines 47-59):
   ```csharp
   var skill = new Skill
   {
       UserId = request.UserId,
       Name = request.Name.Trim(),
       Description = request.Description.Trim(),
       IsOffered = request.IsOffered,
       SkillCategoryId = request.CategoryId,
       ProficiencyLevelId = request.ProficiencyLevelId,
       Tags = request.Tags ?? new List<string>(),
       IsActive = true,
       SearchKeywords = GenerateSearchKeywords(name, description, tags),
       CreatedBy = request.UserId
   };
   ```

6. **Generate Search Keywords** (lines 82-99):
   ```csharp
   private static string GenerateSearchKeywords(string name, string description, List<string>? tags)
   {
       var keywords = new List<string> { name };

       // Add significant words from description (length > 3, take 10)
       var descriptionWords = description.Split(' ', StringSplitOptions.RemoveEmptyEntries)
           .Where(w => w.Length > 3)
           .Take(10);
       keywords.AddRange(descriptionWords);

       // Add tags
       if (tags != null) keywords.AddRange(tags);

       return string.Join(" ", keywords.Distinct()).ToLowerInvariant();
   }
   ```

7. **Save to Database** (lines 61-63):
   ```csharp
   await _unitOfWork.Skills.CreateAsync(skill, cancellationToken);
   await _unitOfWork.SaveChangesAsync(cancellationToken);
   ```

8. **Create Response** (lines 68-77):
   ```csharp
   var response = new CreateSkillResponse(
       skill.Id,
       skill.Name,
       skill.Description,
       category.Id,
       proficiencyLevel.Id,
       skill.Tags,
       skill.IsOffered,
       "Active",
       skill.CreatedAt);
   ```

9. **Return Success** (line 79)

---

### Event-Driven Side Effects

#### Domain Event: SkillCreatedDomainEvent
- **Handler**: `SkillCreatedDomainEventHandler`
- **File**: `src/services/SkillService/SkillService.Application/EventHandlers/SkillCreatedDomainEventHandler.cs`
- **Status**: ⚠️ **COMPLETELY COMMENTED OUT** (lines 18-56)
- **Original Intent**:
  - Create SkillView activity log entry
  - Update category statistics
  - Publish integration event
- **Current State**: NO ACTIONS TAKEN

#### Integration Events
- **None**: No integration events are published
- **No other services react** to skill creation

---

### Cache Invalidation

#### Automatic (via CacheInvalidationBehavior)
- **Patterns**:
  - `skills-search:*` - Invalidate all skill search caches
  - `user-skills:*` - Invalidate all user skill list caches
  - `skill-categories:*` - Invalidate category statistics

---

### Summary

| Layer | Component | File |
|-------|-----------|------|
| **Frontend** | Form | `SkillForm.tsx:146-160` |
| | Hook | `useSkills.ts:146-148` |
| | Thunk | `skillsThunks.ts:164-209` |
| | API Service | `skillsService.ts:65-70` |
| **Gateway** | Route | POST /api/skills → Port 5002 |
| **Backend** | Endpoint | `SkillControllerExtensions.cs:139-158` |
| | Command | `CreateSkillCommand.cs` |
| | Handler | `CreateSkillCommandHandler.cs` |
| | Events | None (Domain event handler commented out) |

**Note**: This is a **self-contained flow** with no cross-service communication or notifications.

---

## Flow 4: Update Profile

### Beschreibung
User aktualisiert sein Profil (Vorname, Nachname, Username, Bio).

### Frontend Flow

#### 1. **UI: Form Submission**
- **File**: `src/client/src/pages/profile/ProfilePage.tsx:128-150`
- **User Action**: Bearbeitet Profil-Felder und klickt "Speichern"
- **Form Validation**: React Hook Form + Zod Schema
- **Form Data**:
  ```typescript
  {
      firstName: string,
      lastName: string,
      email: string,
      bio?: string
  }
  ```

#### 2. **Hook: useAuth**
- **File**: `src/client/src/hooks/useAuth.ts:118-120`
- **Function**: `updateProfile(profileData)`
- **Dispatches**: `updateProfileAction` thunk

#### 3. **Thunk: updateProfile**
- **File**: `src/client/src/features/auth/authThunks.ts:45-51`
- **Async Action**:
  ```typescript
  async (profileData: UpdateProfileRequest, { rejectWithValue }) => {
      const response = await authService.updateProfile(profileData);
      return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
  ```

#### 4. **API Service**
- **File**: `src/client/src/api/services/authService.ts:96-101`
- **Method**: `updateProfile(profileData)`
- **HTTP Call**: `apiClient.post<UpdateUserProfileResponse>(PROFILE_ENDPOINTS.UPDATE, profileData)`

#### 5. **API Client**
- **Method**: `POST /api/users/profile` *(Note: POST not PUT!)*
- **Authentication**: Bearer Token

---

### Gateway Routing

#### Gateway Configuration
- **Upstream**: `PUT /api/users/profile`
- **Downstream**: `http://localhost:5001/api/users/profile`
- **Service**: UserService (Port 5001)
- **Note**: Frontend uses POST, Gateway expects PUT - possible mismatch!

---

### Backend Flow

#### 6. **Minimal API Endpoint**
- **File**: `src/services/UserService/UserService.Api/Extensions/UserProfileControllerExtensions.cs:121-135`
- **Endpoint**: `PUT /api/users/profile`
- **Handler**: `HandleUpdateUserProfile`
- **Process**:
  1. Extract `userId` from JWT
  2. Create `UpdateUserProfileCommand`:
     ```csharp
     var command = new UpdateUserProfileCommand(
         request.FirstName,
         request.LastName,
         request.UserName,
         request.Bio
     ) { UserId = userId };
     ```
  3. Send via MediatR: `mediator.SendCommand(command)`

#### 7. **Command**
- **File**: `src/services/UserService/UserService.Application/Commands/UpdateUserProfileCommand.cs`
- **Implements**: `ICommand<UpdateUserProfileResponse>`, `IAuditableCommand`, `ICacheInvalidatingCommand`
- **Properties**:
  ```csharp
  public record UpdateUserProfileCommand(
      string? FirstName = null,
      string? LastName = null,
      string? UserName = null,
      string? PhoneNumber = null,
      string? Bio = null,
      string? TimeZone = null,
      Dictionary<string, string>? Preferences = null)
  ```

- **Cache Invalidation Patterns**:
  ```csharp
  public string[] InvalidationPatterns => new[]
  {
      "user-profile:*",
      "public-profile:*",
      "user-statistics:*"
  };
  ```

#### 8. **FluentValidation**
- **Validator**: `UpdateUserProfileCommandValidator`
- **Rules**:
  - UserId: required
  - FirstName: max 100 chars, alphanumeric + German umlauts
  - LastName: max 100 chars, alphanumeric + German umlauts
  - PhoneNumber: E.164 format
  - Bio: max 1000 characters
  - TimeZone: must be valid system timezone

#### 9. **Command Handler**
- **File**: `src/services/UserService/UserService.Application/CommandHandlers/UpdateUserProfileCommandHandler.cs:23-70`

##### Process:
1. **Validate UserId** (line 25):
   ```csharp
   if (request.UserId is null)
       return Error("UserId is required", ErrorCodes.RequiredFieldMissing);
   ```

2. **Update User Profile via Repository** (lines 29-35):
   ```csharp
   var user = await _userProfileRepository.UpdateUserProfile(
       request.UserId,
       request.FirstName ?? "",
       request.LastName ?? "",
       request.UserName ?? "",
       request.Bio,
       cancellationToken);
   ```

3. **Publish Domain Event** (lines 39-48):
   ```csharp
   await _eventPublisher.Publish(new UserProfileUpdatedDomainEvent(
       user.Id,
       user.Email,
       new Dictionary<string, string>
       {
           { "FirstName", user.FirstName },
           { "LastName", user.LastName },
           { "UserName", user.UserName ?? "" },
           { "Bio", user.Bio ?? "" }
       }), cancellationToken);
   ```

4. **Create Response** (lines 52-61):
   ```csharp
   var response = new UpdateUserProfileResponse(
       user.Id,
       user.Email,
       user.FirstName,
       user.LastName,
       user.UserName,
       user.PhoneNumber ?? "",
       user.Bio,
       user.TimeZone ?? "",
       user.UpdatedAt);
   ```

5. **Return Success** (line 63)

---

### Event-Driven Side Effects

#### Domain Event: UserProfileUpdatedDomainEvent
- **Purpose**: Event sourcing, internal domain event
- **No handlers found** - likely logged for audit trail

#### Integration Events
- **None**: No integration events published
- **No other services react** to profile updates

---

### Cache Invalidation

#### Automatic (via CacheInvalidationBehavior)
- **Patterns**:
  - `user-profile:*` - Invalidate all user profile caches
  - `public-profile:*` - Invalidate public profile caches
  - `user-statistics:*` - Invalidate user statistics

---

### Potential Issues

⚠️ **HTTP Method Mismatch**:
- Frontend API Service uses `POST /api/users/profile`
- Gateway expects `PUT /api/users/profile`
- This may cause routing failures!

---

### Summary

| Layer | Component | File |
|-------|-----------|------|
| **Frontend** | Form | `ProfilePage.tsx:128-150` |
| | Hook | `useAuth.ts:118-120` |
| | Thunk | `authThunks.ts:45-51` |
| | API Service | `authService.ts:96-101` |
| **Gateway** | Route | PUT /api/users/profile → Port 5001 |
| **Backend** | Endpoint | `UserProfileControllerExtensions.cs:121-135` |
| | Command | `UpdateUserProfileCommand.cs` |
| | Handler | `UpdateUserProfileCommandHandler.cs` |
| | Events | UserProfileUpdatedDomainEvent (no handlers) |

**Note**: Self-contained flow with no cross-service communication.

---

## Flow 5: Create Appointment (Manuell)

### Beschreibung
User erstellt manuell einen Termin direkt (nicht über Match-Acceptance).

### Frontend Flow

#### 1. **UI: Form Submission**
- **File**: `src/client/src/components/appointments/AppointmentForm.tsx:121-150`
- **User Action**: Füllt AppointmentForm aus und klickt "Termin erstellen"
- **Form Validation**: React Hook Form + Zod Schema
- **Form Data**:
  ```typescript
  {
      matchId: string,
      startDate: Date,
      startTime: Date,
      endTime: Date,
      notes?: string
  }
  ```

- **Validation Rules**:
  - `startDate`: Must be in future
  - `endTime`: Must be after `startTime`
  - `notes`: Max 500 characters

#### 2. **Transform to AppointmentRequest** (lines 124-145):
```typescript
const appointmentRequest: AppointmentRequest = {
    matchId: data.matchId,
    startTime: startDateTime.toISOString(),
    endTime: endDateTime.toISOString(),
    notes: data.notes,
};
```

#### 3. **Hook: useAppointments (or direct from component)**
- **Calls**: `createAppointment` thunk

#### 4. **Thunk: createAppointment**
- **File**: `src/client/src/features/appointments/appointmentsThunks.ts:239-250`
- **Async Action**:
  ```typescript
  async (appointmentData: AppointmentRequest, { rejectWithValue }) => {
      const response = await appointmentService.createAppointment(appointmentData);
      return isSuccessResponse(response) ? response : rejectWithValue(response);
  }
  ```

#### 5. **API Service**
- **File**: `src/client/src/api/services/appointmentService.ts:73-79`
- **Method**: `createAppointment(appointmentData)`
- **Validation**:
  ```typescript
  if (!appointmentData.title) throw new Error('Titel ist erforderlich');
  if (!appointmentData.scheduledDate) throw new Error('Terminzeit ist erforderlich');
  if (!appointmentData.durationMinutes) throw new Error('Dauer ist erforderlich');
  if (!appointmentData.participantUserId) throw new Error('Teilnehmer-ID ist erforderlich');
  ```
- **HTTP Call**: `apiClient.post<Appointment>(APPOINTMENT_ENDPOINTS.CREATE, appointmentData)`

#### 6. **API Client**
- **Method**: `POST /api/appointments`
- **Authentication**: Bearer Token

---

### Gateway Routing

#### Gateway Configuration
- **Upstream**: `POST /api/appointments`
- **Downstream**: `http://localhost:5004/appointments`
- **Service**: AppointmentService (Port 5004)

---

### Backend Flow

#### 7. **Minimal API Endpoint**
- **File**: `src/services/AppointmentService/AppointmentService.Api/Extensions/AppointmentControllerExtensions.cs:19-23`
- **Endpoint**: `POST /appointments`
- **Handler**: `HandleCreateAppointment` (found via grep, lines 139-158 approx)

##### Implementation:
```csharp
static async Task<IResult> HandleCreateAppointment(
    IMediator mediator, ClaimsPrincipal user, [FromBody] CreateAppointmentRequest request)
{
    var userId = user.GetUserId();
    if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

    var command = new CreateAppointmentCommand(
        request.Title,
        request.Description,
        request.ScheduledDate,
        request.DurationMinutes,
        request.ParticipantUserId,
        request.SkillId,
        request.MeetingType)
    {
        UserId = userId
    };

    return await mediator.SendCommand(command);
}
```

#### 8. **Command**
- **File**: `src/services/AppointmentService/AppointmentService.Application/Commands/CreateAppointmentCommand.cs`
- **Implements**: `ICommand<CreateAppointmentResponse>`, `IAuditableCommand`, `ICacheInvalidatingCommand`
- **Properties**:
  ```csharp
  public record CreateAppointmentCommand(
      string Title,
      string? Description,
      DateTime ScheduledDate,
      int DurationMinutes,
      string ParticipantUserId,
      string? SkillId = null,
      string? MatchId = null,
      string? MeetingType = "VideoCall")
  ```

- **Cache Invalidation Patterns**:
  ```csharp
  public string[] InvalidationPatterns => new[]
  {
      "user-appointments:{UserId}:*",           // Organizer's appointments
      "user-appointments:{ParticipantUserId}:*", // Participant's appointments
      "appointment-details:*"                    // All appointment details
  };
  ```

#### 9. **FluentValidation**
- **Validator**: `CreateAppointmentCommandValidator`
- **Rules**:
  - Title: 3-200 characters
  - Description: max 2000 characters
  - ScheduledDate: must be in future, max 1 year ahead
  - DurationMinutes: 15-480 (15 minutes to 8 hours)
  - ParticipantUserId: required, must not be self
  - MeetingType: one of ["VideoCall", "InPerson", "Phone", "Online"]

#### 10. **Command Handler**
- **File**: `src/services/AppointmentService/AppointmentService.Application/CommandHandlers/CreateAppointmentCommandHandler.cs:23-78`

##### Process:

1. **Check Scheduling Conflicts** (lines 28-41):
   ```csharp
   var hasConflict = await _unitOfWork.Appointments.HasSchedulingConflictAsync(
       request.UserId!,
       request.ScheduledDate,
       request.DurationMinutes,
       null, // appointmentIdToExclude
       cancellationToken);

   if (hasConflict)
   {
       throw new InvalidOperationException(
           "CreateAppointment",
           "SchedulingConflict",
           "Scheduling conflict detected. Please choose a different time.");
   }
   ```

2. **Create Appointment Entity** (lines 43-55):
   ```csharp
   var appointment = new Appointment
   {
       Title = request.Title,
       Description = request.Description,
       ScheduledDate = request.ScheduledDate,
       DurationMinutes = request.DurationMinutes,
       OrganizerUserId = request.UserId!,
       ParticipantUserId = request.ParticipantUserId,
       SkillId = request.SkillId,
       MatchId = request.MatchId,
       MeetingType = request.MeetingType,
       CreatedBy = request.UserId
   };
   ```

3. **Save to Database** (lines 57-58):
   ```csharp
   await _unitOfWork.Appointments.CreateAsync(appointment, cancellationToken);
   await _unitOfWork.SaveChangesAsync(cancellationToken);
   ```

4. **Publish Domain Event** (lines 61-68):
   ```csharp
   await _eventPublisher.Publish(new AppointmentCreatedDomainEvent(
       appointment.Id,
       appointment.OrganizerUserId,
       appointment.ParticipantUserId,
       appointment.Title,
       appointment.ScheduledDate,
       appointment.SkillId,
       appointment.MatchId), cancellationToken);
   ```

5. **Create Response** (lines 70-75):
   ```csharp
   var response = new CreateAppointmentResponse(
       appointment.Id,
       appointment.Title,
       appointment.ScheduledDate,
       appointment.Status,
       appointment.CreatedAt);
   ```

6. **Return Success** (line 77)

---

### Event-Driven Side Effects

#### Domain Event: AppointmentCreatedDomainEvent
- **No handlers found** - likely used for event sourcing/audit log only

#### Integration Events
- **None**: No integration events published for manual appointment creation
- **No notifications sent** - user creates appointment without automatic notifications

**Note**: This is different from automatic appointment creation via match acceptance, which triggers notification emails.

---

### Cache Invalidation

#### Automatic (via CacheInvalidationBehavior)
- **Patterns**:
  - `user-appointments:{UserId}:*` - Invalidate organizer's appointment cache
  - `user-appointments:{ParticipantUserId}:*` - Invalidate participant's appointment cache
  - `appointment-details:*` - Invalidate all appointment detail caches

**Why Both Users?**
- Cache is invalidated for **both** organizer and participant
- Ensures both users see the new appointment immediately
- Prevents stale data in their appointment lists

---

### Scheduling Conflict Detection

#### Repository Method: HasSchedulingConflictAsync
- **Purpose**: Check if user already has appointment at same time
- **Logic**:
  ```csharp
  // Checks if user has any appointments that overlap with:
  // [ScheduledDate, ScheduledDate + DurationMinutes]
  ```
- **Prevents**: Double-booking of users

---

### Summary

| Layer | Component | File |
|-------|-----------|------|
| **Frontend** | Form | `AppointmentForm.tsx:121-150` |
| | Thunk | `appointmentsThunks.ts:239-250` |
| | API Service | `appointmentService.ts:73-79` |
| **Gateway** | Route | POST /api/appointments → Port 5004 |
| **Backend** | Endpoint | `AppointmentControllerExtensions.cs:139-158` |
| | Command | `CreateAppointmentCommand.cs` |
| | Handler | `CreateAppointmentCommandHandler.cs` |
| | Events | AppointmentCreatedDomainEvent (no handlers) |

**Key Differences vs Automatic Creation**:
- Manual creation: User fills form, no notifications sent
- Automatic creation (via match): Full session hierarchy created, emails sent, meeting links generated

---

## Cache Invalidation Summary

### Pattern Overview

All cache invalidation happens automatically via **MediatR Pipeline Behavior**:

```csharp
// src/shared/Core/CQRS/Behaviors/CacheInvalidationBehavior.cs
public class CacheInvalidationBehavior<TRequest, TResponse>
    : IPipelineBehavior<TRequest, TResponse>
{
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        // 1. Execute command first
        var response = await next(cancellationToken);

        // 2. Check if success
        var success = IsSuccessResponse(response);

        // 3. If successful, invalidate cache
        if (success && request is ICacheInvalidatingCommand cmd)
        {
            await InvalidateCache(cmd, request, cancellationToken);
        }

        return response;
    }
}
```

### Commands with Cache Invalidation

| Flow | Command | Invalidation Patterns |
|------|---------|----------------------|
| **Create Match Request** | CreateMatchRequestCommand | `outgoing-match-requests:*`, `incoming-match-requests:*`, `match-statistics` |
| **Accept Match** | AcceptMatchRequestCommand | Manual in handler + auto (redundant!) |
| **Create Skill** | CreateSkillCommand | `skills-search:*`, `user-skills:*`, `skill-categories:*` |
| **Update Profile** | UpdateUserProfileCommand | `user-profile:*`, `public-profile:*`, `user-statistics:*` |
| **Create Appointment** | CreateAppointmentCommand | `user-appointments:{UserId}:*`, `user-appointments:{ParticipantUserId}:*`, `appointment-details:*` |

### Pattern Placeholder Replacement

The `CacheInvalidationBehavior` replaces placeholders in patterns:

```csharp
// Example: CreateAppointmentCommand
InvalidationPatterns = new[]
{
    "user-appointments:{UserId}:*",
    // Replaced with actual UserId: "user-appointments:123abc:*"

    "user-appointments:{ParticipantUserId}:*"
    // Replaced with actual ParticipantUserId: "user-appointments:456def:*"
};
```

**Reflection Magic**:
- Behavior uses reflection to find properties on command
- If property name matches placeholder (e.g., `{UserId}` → `command.UserId`)
- Replaces placeholder with actual value

### Redis KEYS Pattern Matching

Cache invalidation uses Redis `KEYS` command via Lua script:

```lua
local cursor = "0"
local keys = {}
repeat
    local result = redis.call("SCAN", cursor, "MATCH", ARGV[1])
    cursor = result[1]
    for i, key in ipairs(result[2]) do
        table.insert(keys, key)
        redis.call("DEL", key)
    end
until cursor == "0"
return #keys
```

**Performance Note**:
- `KEYS` command blocks Redis
- For large caches, consider using `SCAN` in production
- Current implementation is fine for MVP

---

## Event-Driven Architecture Overview

### Event Types

#### 1. Domain Events (Event Sourcing)
- **Purpose**: Internal domain events for event sourcing and audit trail
- **Technology**: In-memory MediatR event bus
- **Examples**:
  - `DirectMatchRequestCreatedDomainEvent`
  - `UserProfileUpdatedDomainEvent`
  - `AppointmentCreatedDomainEvent`
  - `ConnectionCreatedEvent`

**Publishing**:
```csharp
await _eventPublisher.Publish(new SkillCreatedDomainEvent(...), cancellationToken);
```

**Handlers**:
- Often commented out or empty in current codebase
- Originally intended for updating read models, statistics, etc.

#### 2. Integration Events (Service-to-Service Communication)
- **Purpose**: Cross-service communication
- **Technology**: RabbitMQ via MassTransit
- **Examples**:
  - `MatchRequestCreatedIntegrationEvent`
  - `MatchAcceptedIntegrationEvent`
  - `AppointmentsCreatedIntegrationEvent`

**Publishing**:
```csharp
await _publishEndpoint.Publish(
    new MatchAcceptedIntegrationEvent(...),
    cancellationToken);
```

**Consumers**:
```csharp
public class MatchAcceptedIntegrationEventHandler
    : IConsumer<MatchAcceptedIntegrationEvent>
{
    public async Task Consume(ConsumeContext<MatchAcceptedIntegrationEvent> context)
    {
        var message = context.Message;
        // React to event
    }
}
```

---

### Integration Event Flows

#### Match Request Created
```
MatchmakingService: CreateMatchRequestCommandHandler
  ↓ publishes
MatchRequestCreatedIntegrationEvent
  ↓ consumed by
NotificationService: MatchRequestCreatedIntegrationEventConsumer
  ↓ actions
- Create Notification entity
- Send email to target user
- Send SignalR push notification
```

#### Match Accepted
```
MatchmakingService: AcceptMatchRequestCommandHandler
  ↓ publishes
MatchAcceptedIntegrationEvent
  ↓ consumed by
AppointmentService: MatchAcceptedIntegrationEventHandler
  ↓ calls
SessionOrchestrationService.CreateSessionHierarchyFromMatchAsync()
  ↓ creates
- Connection entity
- SessionSeries entities (1-2)
- SessionAppointments entities (N)
  ↓ publishes
AppointmentsCreatedIntegrationEvent
  ↓ consumed by
NotificationService: AppointmentsCreatedIntegrationEventConsumer
  ↓ actions
- Send emails to both users
- Send SignalR push notifications
```

---

### RabbitMQ Configuration

**Exchange**: `skillswap-events` (Fanout)

**Queues**:
- `notification-service-events`
- `appointment-service-events`
- (other services...)

**Message Routing**:
- Integration events published to exchange
- Exchange routes to all bound queues
- Each service consumes events relevant to it

---

## Key Learnings & Best Practices

### ✅ What Works Well

1. **Automatic Cache Invalidation via Behavior**
   - Clean separation of concerns
   - No manual cache invalidation needed in handlers
   - Pattern-based invalidation very flexible

2. **Event-Driven Architecture**
   - Loose coupling between services
   - Clear separation: Domain Events vs Integration Events
   - Async processing via RabbitMQ

3. **CQRS with MediatR**
   - Clean command/query separation
   - Easy to add cross-cutting concerns via behaviors
   - Type-safe with strong contracts

4. **FluentValidation**
   - Field validation isolated in validators
   - Business logic validation in handlers
   - Clear error messages

### ⚠️ Areas for Improvement

1. **Redundant Cache Invalidation**
   - **Example**: `AcceptMatchRequestCommandHandler` manually invalidates cache
   - **Problem**: Command already has `ICacheInvalidatingCommand` → behavior invalidates automatically
   - **Fix**: Remove manual invalidation in handlers

2. **Commented Out Event Handlers**
   - **Example**: `SkillCreatedDomainEventHandler` completely commented out
   - **Problem**: Dead code, unclear intent
   - **Fix**: Either implement or delete

3. **HTTP Method Inconsistency**
   - **Example**: UpdateProfile uses POST in frontend but PUT in gateway
   - **Problem**: May cause routing failures
   - **Fix**: Align frontend and backend

4. **No Notifications for Manual Appointments**
   - **Example**: Manual appointment creation doesn't send notifications
   - **Problem**: User experience inconsistency
   - **Fix**: Consider sending notifications for manual appointments too

5. **Missing Integration Events**
   - **Example**: Skill creation doesn't publish integration events
   - **Problem**: Other services can't react (e.g., recommendations)
   - **Fix**: Decide which events warrant cross-service notifications

---

## Testing Recommendations

### Unit Tests
```csharp
[Fact]
public async Task CreateSkill_WithValidData_ReturnsSuccess()
{
    // Arrange
    var command = new CreateSkillCommand("C#", "Programming Language", categoryId, levelId, tags, true);
    command.UserId = "user123";

    // Act
    var result = await _handler.Handle(command, CancellationToken.None);

    // Assert
    Assert.True(result.IsSuccess);
    Assert.NotNull(result.Data);
}
```

### Integration Tests
```csharp
[Fact]
public async Task AcceptMatch_CreatesAppointments_SendsNotifications()
{
    // Arrange: Create match request
    var matchRequest = await CreateMatchRequest();

    // Act: Accept match
    await AcceptMatch(matchRequest.Id);

    // Assert: Verify appointments created
    var appointments = await GetAppointments(matchRequest.RequesterId);
    Assert.NotEmpty(appointments);

    // Assert: Verify email sent
    _emailServiceMock.Verify(x => x.SendEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()), Times.Once);
}
```

---

## Appendix: File Reference

### Frontend Key Files

| Purpose | File |
|---------|------|
| Match Request Form | `src/client/src/pages/skills/SkillDetailPage.tsx` |
| Match Requests Overview | `src/client/src/pages/matchmaking/MatchRequestsOverviewPage.tsx` |
| Skill Form | `src/client/src/components/skills/SkillForm.tsx` |
| Profile Page | `src/client/src/pages/profile/ProfilePage.tsx` |
| Appointment Form | `src/client/src/components/appointments/AppointmentForm.tsx` |
| Matchmaking Hook | `src/client/src/hooks/useMatchmaking.ts` |
| Skills Hook | `src/client/src/hooks/useSkills.ts` |
| Auth Hook | `src/client/src/hooks/useAuth.ts` |
| Matchmaking Thunks | `src/client/src/features/matchmaking/matchmakingThunks.ts` |
| Skills Thunks | `src/client/src/features/skills/thunks/skillsThunks.ts` |
| Auth Thunks | `src/client/src/features/auth/authThunks.ts` |
| Appointments Thunks | `src/client/src/features/appointments/appointmentsThunks.ts` |

### Backend Key Files

| Service | Purpose | File |
|---------|---------|------|
| **MatchmakingService** | Endpoints | `MatchmakingControllerExtensions.cs` |
| | Commands | `CreateMatchRequestCommand.cs`, `AcceptMatchRequestCommand.cs` |
| | Handlers | `CreateMatchRequestCommandHandler.cs`, `AcceptMatchRequestCommandHandler.cs` |
| **AppointmentService** | Endpoints | `AppointmentControllerExtensions.cs` |
| | Commands | `CreateAppointmentCommand.cs` |
| | Handlers | `CreateAppointmentCommandHandler.cs` |
| | Event Handlers | `MatchAcceptedIntegrationEventHandler.cs` |
| | Orchestration | `SessionOrchestrationService.cs` |
| **SkillService** | Endpoints | `SkillControllerExtensions.cs` |
| | Commands | `CreateSkillCommand.cs` |
| | Handlers | `CreateSkillCommandHandler.cs` |
| **UserService** | Endpoints | `UserProfileControllerExtensions.cs` |
| | Commands | `UpdateUserProfileCommand.cs` |
| | Handlers | `UpdateUserProfileCommandHandler.cs` |
| **NotificationService** | Consumers | `MatchRequestCreatedIntegrationEventConsumer.cs` |
| | | `AppointmentsCreatedIntegrationEventConsumer.cs` |

### Shared Infrastructure

| Purpose | File |
|---------|------|
| Cache Invalidation Behavior | `src/shared/Core/CQRS/Behaviors/CacheInvalidationBehavior.cs` |
| Redis Cache Service | `src/shared/Infrastructure/Caching/RedisDistributedCacheService.cs` |
| Integration Events | `src/shared/Core/Events/Integration/` |
| Domain Events | `src/shared/Core/Events/Domain/` |

---

**Ende der Dokumentation**

Alle 5 End-to-End Flows sind vollständig analysiert und dokumentiert.
Nächste Schritte: Testing implementieren, Event Handlers vervollständigen, Code Smells beheben.
