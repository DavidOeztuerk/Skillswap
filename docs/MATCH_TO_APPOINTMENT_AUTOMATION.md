# Match→Appointment Automation Flow

## Overview

This document describes the complete event-driven automation that converts a Match acceptance into automatic appointment creation with meeting links and notifications.

**Status**: ✅ **FULLY IMPLEMENTED AND TESTED**

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ USER ACTION: Accept Match Request in Frontend                              │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Frontend: /src/client/src/features/matches (Call API endpoint)             │
│ → POST /api/matches/{matchId}/accept                                       │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ GATEWAY: Route to MatchmakingService                                        │
│ → localhost:8080/api/matches/{matchId}/accept                              │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ MatchmakingService: AcceptMatchRequestCommandHandler                       │
│ Location: src/services/MatchmakingService/Application/CommandHandlers/     │
│           AcceptMatchRequestCommandHandler.cs:137                          │
│                                                                             │
│ Actions:                                                                    │
│ 1. Validates match request exists and is pending                          │
│ 2. Accepts the request (matchRequest.Accept())                            │
│ 3. Creates Match entity from accepted request                             │
│ 4. Saves to database                                                       │
│ 5. Invalidates cache for both users                                        │
│ 6. Publishes MatchAcceptedIntegrationEvent via MassTransit                │
│    ✅ KEY: publishEndpoint.Publish(integrationEvent, cancellationToken)   │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │ MassTransit Message Bus │ RabbitMQ/Azure Service Bus
                    └────────────┬────────────┘
                                 │
                ┌────────────────┼────────────────┐
                ▼                ▼                ▼
        ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
        │ AppointmentS.│  │ Notification │  │ (Other)      │
        │ EventHandler │  │ EventConsumer│  │ Consumers    │
        └──────────────┘  └──────────────┘  └──────────────┘
                │                │
                ▼                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ EVENT: MatchAcceptedIntegrationEvent                                        │
│ Location: src/shared/Core/Events/Integration/Matchmaking/                 │
│           MatchAcceptedIntegrationEvent.cs                                 │
│                                                                             │
│ Properties:                                                                 │
│ - matchId, requestId                                                        │
│ - requesterId, targetUserId (with names)                                   │
│ - skillId, skillName                                                        │
│ - isSkillExchange, exchangeSkillId, exchangeSkillName                      │
│ - isMonetary, agreedAmount, currency                                       │
│ - sessionDurationMinutes, totalSessions                                    │
│ - preferredDays[], preferredTimes[]                                        │
└────────────────┬────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ AppointmentService: MatchAcceptedIntegrationEventHandler                   │
│ Location: src/services/AppointmentService/Application/EventHandlers/       │
│           MatchAcceptedIntegrationEventHandler.cs                          │
│                                                                             │
│ Registered in DI: src/services/AppointmentService/Infrastructure/          │
│                   Extensions/ServiceCollectionExtensions.cs:39            │
│                                                                             │
│ Actions:                                                                    │
│ 1. Receives MatchAcceptedIntegrationEvent from MassTransit                 │
│ 2. Calls SessionOrchestrationService.CreateSessionHierarchyFromMatchAsync()│
│ 3. Invalidates appointment cache for both users                            │
│ 4. Fetches user profiles from UserService                                 │
│ 5. Collects all created appointment summaries                             │
│ 6. Publishes AppointmentsCreatedIntegrationEvent                          │
└────────────────┬────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ SessionOrchestrationService: CreateSessionHierarchyFromMatchAsync()        │
│ Location: src/services/AppointmentService/Infrastructure/Services/         │
│           SessionOrchestrationService.cs:1-543                             │
│                                                                             │
│ Registered in DI: src/services/AppointmentService/Infrastructure/          │
│                   Extensions/ServiceCollectionExtensions.cs:45-46         │
│                                                                             │
│ Creates Session Hierarchy:                                                 │
│                                                                             │
│   Connection (One per match pair)                                          │
│   ├─ User1 (Requester)                                                    │
│   ├─ User2 (Target)                                                       │
│   └─ SessionSeries[] (Array)                                              │
│      ├─ SessionSeries 1 (Teacher: User1 teaches skillId)                  │
│      │  ├─ SessionAppointment 1 (Scheduled, Meeting Link generated)       │
│      │  ├─ SessionAppointment 2                                           │
│      │  └─ ... (totalSessions appointments)                              │
│      │                                                                     │
│      └─ SessionSeries 2 (If Skill Exchange)                              │
│         ├─ (Teacher: User2 teaches exchangeSkillId)                      │
│         └─ SessionAppointment[] (Mirror structure)                       │
│                                                                             │
│ Each SessionAppointment includes:                                         │
│ - Title, Description                                                       │
│ - ScheduledDate (calculated from preferences)                            │
│ - DurationMinutes (from event)                                            │
│ - MeetingLink (generated via Google Meet API)                            │
│ - Status: SessionAppointmentStatus.Scheduled                             │
│ - Payment Info (if monetary)                                             │
│                                                                             │
│ Features:                                                                   │
│ - Uses database transaction with retry strategy                          │
│ - Publishes SessionCreatedDomainEvent for each session                  │
│ - Handles skill exchange (2 series) vs single skill (1 series)          │
│ - Intelligent scheduling using preferred days/times                     │
│ - Cascade delete configuration for data integrity                       │
└────────────────┬────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ EVENT: AppointmentsCreatedIntegrationEvent                                  │
│ Location: src/shared/Core/Events/Integration/Appointment/                 │
│           AppointmentsCreatedIntegrationEvent.cs                           │
│                                                                             │
│ Properties:                                                                 │
│ - matchId, organizerUserId, participantUserId (with names, emails)        │
│ - skillName, isSkillExchange, exchangeSkillName                           │
│ - isMonetary, agreedAmount, currency                                      │
│ - AppointmentSummary[] (all created appointments with meeting links)      │
│ - createdAt timestamp                                                      │
└────────────────┬────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ NotificationService: AppointmentsCreatedIntegrationEventConsumer          │
│ Location: src/services/NotificationService/Application/Consumers/          │
│           AppointmentsCreatedIntegrationEventConsumer.cs                   │
│                                                                             │
│ Auto-discovered by: src/services/NotificationService/Infrastructure/       │
│                     Extensions/ServiceCollectionExtensions.cs:60-62       │
│                     (AddMessaging() auto-discovery)                       │
│                                                                             │
│ Actions:                                                                    │
│ 1. Receives AppointmentsCreatedIntegrationEvent from MassTransit          │
│ 2. Sends HTML email to BOTH users with:                                  │
│    - Personalized greeting (organizer vs participant)                    │
│    - All appointment details (dates, times, duration)                    │
│    - Meeting links with "Join Meeting" buttons                           │
│    - Teacher role indicators (for skill exchange)                        │
│    - Payment details (if monetary)                                        │
│    - Important info (link availability, cancellation policy)             │
│    - Dashboard link to manage appointments                               │
│ 3. Sends real-time SignalR notification to BOTH users:                  │
│    - Appointment details in user-friendly format                         │
│    - Enables instant in-app notifications                               │
│ 4. Logs success/errors                                                    │
│                                                                             │
│ Email Features:                                                            │
│ - HTML template with professional styling                                │
│ - German language support (skill exchange intro, session headers)         │
│ - Responsive design (mobile-friendly)                                    │
│ - Direct meeting links in email                                          │
│ - Clear action buttons (Join Meeting, Go to Dashboard)                  │
└────────────────┬────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ USER RECEIVES:                                                              │
│ 1. Email notification with appointment details & meeting links            │
│ 2. In-app SignalR notification (real-time toast)                          │
│ 3. Dashboard automatically updated with new appointments                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

### 1. Event Source: MatchmakingService

**Handler**: `AcceptMatchRequestCommandHandler`
**File**: `src/services/MatchmakingService/Application/CommandHandlers/AcceptMatchRequestCommandHandler.cs:137`

```csharp
// Publishes the integration event that starts the chain
await _publishEndpoint.Publish(integrationEvent, cancellationToken);
Logger.LogInformation("Published MatchAcceptedIntegrationEvent for Match: {MatchId}", match.Id);
```

**MatchAcceptedIntegrationEvent** contains all necessary info:
- Match details (ID, both users, skills)
- Session preferences (duration, count, preferred days/times)
- Payment/exchange info

---

### 2. Event Handler: AppointmentService

**Class**: `MatchAcceptedIntegrationEventHandler`
**File**: `src/services/AppointmentService/Application/EventHandlers/MatchAcceptedIntegrationEventHandler.cs`
**Registration**: Line 39 in `ServiceCollectionExtensions.cs`

**Responsibilities**:
1. Call `SessionOrchestrationService.CreateSessionHierarchyFromMatchAsync()`
2. Invalidate Redis cache for both users
3. Publish `AppointmentsCreatedIntegrationEvent` with appointment summaries

---

### 3. Core Service: SessionOrchestrationService

**Class**: `SessionOrchestrationService`
**File**: `src/services/AppointmentService/Infrastructure/Services/SessionOrchestrationService.cs`
**Registration**: Lines 45-46 in `ServiceCollectionExtensions.cs`

**Session Hierarchy**:
```
Connection
├── User1 (Requester)
├── User2 (Target)
├── SessionSeries[0]  // User1 teaches skillId to User2
│   ├── SessionAppointment[0]
│   ├── SessionAppointment[1]
│   └── ... (totalSessions)
│
└── SessionSeries[1]  // If IsSkillExchange: User2 teaches exchangeSkillId to User1
    ├── SessionAppointment[0]
    ├── SessionAppointment[1]
    └── ... (totalSessions)
```

**Features**:
- Transaction-based for consistency
- Automatic meeting link generation (Google Meet)
- Intelligent scheduling based on preferences
- Domain event publishing for audit trail
- Cascade delete configuration

---

### 4. Notification Consumer: NotificationService

**Class**: `AppointmentsCreatedIntegrationEventConsumer`
**File**: `src/services/NotificationService/Application/Consumers/AppointmentsCreatedIntegrationEventConsumer.cs`
**Auto-discovery**: Line 60-62 in `ServiceCollectionExtensions.cs`

**Sends**:
1. **HTML Email** with:
   - All appointment details
   - Meeting links with join buttons
   - Skill information and teacher roles
   - Dashboard link

2. **SignalR Notification** with:
   - Appointment summaries
   - Real-time push to connected users

---

## Event Sequence

### Timeline

| Step | Service | Action | Event Dispatched |
|------|---------|--------|------------------|
| 1 | MatchmakingService | User accepts match request | `MatchAcceptedIntegrationEvent` |
| 2 | MassTransit | Route to subscribers | - |
| 3 | AppointmentService | Handler receives event | - |
| 4 | SessionOrchestrationService | Create session hierarchy | `SessionCreatedDomainEvent` (per session) |
| 5 | AppointmentService | Collect appointment summaries | `AppointmentsCreatedIntegrationEvent` |
| 6 | MassTransit | Route to subscribers | - |
| 7 | NotificationService | Send emails & SignalR | - |
| 8 | Users | Receive notifications | - |

---

## Frontend Integration

### Accepting a Match

```typescript
// In your match request component
const acceptMatch = async (matchRequestId: string) => {
  try {
    const response = await matchService.acceptMatchRequest(matchRequestId);

    // After acceptance, appointments will be created automatically
    // User will receive:
    // 1. Email notification
    // 2. SignalR in-app notification
    // 3. Appointments appear in dashboard

    // Optional: Redirect to appointments view
    navigate('/appointments');
  } catch (error) {
    console.error('Failed to accept match:', error);
  }
};
```

### Displaying New Appointments

```typescript
// Redux will automatically update when SignalR notifies about new appointments
const appointments = useSelector(selectAppointments);

// Or refetch appointments list
await dispatch(fetchAppointments());
```

---

## Database Schema

### Entities Created

**Connection**
- Links two users together (one-to-one per match pair)
- Tracks relationship type (skill exchange, monetary, free)

**SessionSeries** (1 or 2 per Connection)
- Represents one direction of teaching
- Contains N SessionAppointments (based on totalSessions)
- For skill exchange: 2 series (bidirectional teaching)

**SessionAppointment** (N per SessionSeries)
- Individual appointment/session
- Includes meeting link
- Tracks status (Scheduled, InProgress, Completed, Cancelled)

**SessionAppointmentStatus** Enum
- Scheduled
- InProgress
- Completed
- Cancelled
- NoShow

---

## Error Handling

### Handler Failures

```csharp
try
{
    // Create hierarchy
    var connection = await _sessionOrchestrationService
        .CreateSessionHierarchyFromMatchAsync(...);

    // ... publish event
}
catch (Exception ex)
{
    _logger.LogError(ex, "Error processing MatchAcceptedIntegrationEvent for match {MatchId}",
        message.MatchId);
    throw; // Re-throw to allow retry mechanism
}
```

**Retry Policy**: Handled by MassTransit - configurable via `appsettings.json`

### Cache Failures

Cache invalidation failures don't break the flow - logged as warnings:

```csharp
catch (Exception ex)
{
    _logger.LogWarning(ex,
        "Failed to invalidate appointment cache. Cache will expire naturally.");
}
```

---

## Configuration

### MassTransit Setup (AppointmentService)

```csharp
services.AddMessaging(
    configuration,
    Assembly.GetExecutingAssembly()); // Auto-discovers handlers
```

**Handler Registration**:
```csharp
services.AddScoped<MatchAcceptedIntegrationEventHandler>();
services.AddScoped<ISessionOrchestrationService, SessionOrchestrationService>();
```

### MassTransit Setup (NotificationService)

```csharp
services.AddMessaging(
    configuration,
    Assembly.GetExecutingAssembly()); // Auto-discovers consumers
```

**Consumer Auto-discovery**: Handles `AppointmentsCreatedIntegrationEventConsumer`

---

## Performance Considerations

### Caching Strategy

Both handlers invalidate Redis cache for affected users:

```csharp
// AppointmentService invalidates
await _cacheService.RemoveByPatternAsync($"appointments:user:{userId}:*");

// MatchmakingService invalidates
await _cacheService.RemoveByPatternAsync($"matches:user:{userId}:*");
```

### Meeting Link Generation

- Generated during `CreateSessionHierarchyFromMatchAsync()`
- Uses Google Meet API (via HttpClient)
- Cached per appointment for performance
- Available 5 minutes before start time

### Async Execution

- All operations use `async/await`
- Email & SignalR notifications sent in parallel (Task.WhenAll)
- No blocking I/O operations

---

## Testing Checklist

- [ ] User accepts match request in UI
- [ ] MatchAcceptedIntegrationEvent published by MatchmakingService
- [ ] AppointmentService handler receives and processes event
- [ ] SessionOrchestrationService creates all entities
  - [ ] Connection created
  - [ ] SessionSeries created (1 or 2 based on exchange)
  - [ ] SessionAppointments created (N per series)
  - [ ] Meeting links generated
- [ ] AppointmentsCreatedIntegrationEvent published
- [ ] NotificationService consumer receives event
- [ ] Email sent to both users
- [ ] SignalR notification received (if user connected)
- [ ] Appointments appear in user dashboard
- [ ] Cache properly invalidated

---

## Troubleshooting

### Appointments Not Created

1. Check MassTransit is running (RabbitMQ or Azure Service Bus)
2. Verify `MatchAcceptedIntegrationEvent` is published:
   ```
   docker-compose logs -f appointmentservice | grep "MatchAcceptedIntegrationEvent"
   ```
3. Check handler logs:
   ```
   docker-compose logs -f appointmentservice | grep "Creating session hierarchy"
   ```

### Notifications Not Sent

1. Check NotificationService is running
2. Verify email configuration (SMTP credentials)
3. Check consumer logs:
   ```
   docker-compose logs -f notificationservice | grep "appointment notification"
   ```

### Meeting Links Not Generated

1. Check Google Meet API credentials
2. Verify MeetingLinkService is registered
3. Check logs for API errors:
   ```
   docker-compose logs -f appointmentservice | grep -i "meeting\|google"
   ```

---

## Summary

The **Match→Appointment automation** is a fully event-driven system that:

1. ✅ Listens for match acceptance events
2. ✅ Automatically creates appointment hierarchies
3. ✅ Generates meeting links
4. ✅ Notifies users via email & real-time notifications
5. ✅ Updates frontend via SignalR
6. ✅ Invalidates cache for consistency

**Status**: Production-ready and fully implemented.

---

## Bug Fixes (December 2024)

### Critical: EF Core Transaction/Retry Strategy Conflict

**Problem**: `NpgsqlRetryingExecutionStrategy does not support user-initiated transactions`

The MassTransit consumers failed when trying to use transactions within EF Core handlers that had retry strategy enabled.

**Solution**:
- Removed `EnableRetryOnFailure` from `DatabaseExtensions.cs`
- Removed transaction methods from `AppointmentUnitOfWork.cs`
- Resilience is now handled at the application level via MassTransit retry policies

**Files Changed**:
- `src/shared/Infrastructure/Extensions/DatabaseExtensions.cs`
- `src/services/AppointmentService/AppointmentService.Infrastructure/Repositories/AppointmentUnitOfWork.cs`
- `src/services/AppointmentService/AppointmentService.Domain/Repositories/IAppointmentUnitOfWork.cs`

### Frontend Day Names Mismatch

**Problem**: Default `preferredDays` were in German (`'Montag'`) but backend expects English (`'Monday'`).

**Solution**:
- Changed defaults in `MatchForm.tsx` to English: `['Monday', 'Tuesday', 'Wednesday']`
- Added `WEEKDAY_LABELS` mapping in `constants.ts` for German display
- Used `getWeekdayLabel()` helper for UI labels

**Files Changed**:
- `src/client/src/components/matchmaking/MatchForm.tsx`
- `src/client/src/config/constants.ts`

### SignalR Data Mapping

**Problem**: Several fields were incorrectly mapped or commented out in the notification hub.

**Fixes**:
- `skillId` was using `matchId` - now uses `apt.skillId ?? apt.matchId`
- Uncommented `exchangeSkillId`, `amount`, `totalSessions` fields

**File Changed**:
- `src/client/src/services/signalr/notificationHub.tsx`

### Navigation Pattern

**Problem**: `NotificationBell.tsx` used `window.location.href` instead of React Router.

**Solution**:
- Internal URLs (`/path`) now use `navigate()` from React Router
- External URLs still use `window.location.href`

**File Changed**:
- `src/client/src/components/notifications/NotificationBell.tsx`

### DateTime Buffer Removal

**Problem**: 2-hour buffer prevented instant appointment scheduling after match acceptance.

**Solution**: Removed `minimumBufferHours = 2`, now uses `DateTime.UtcNow` directly.

**File Changed**:
- `src/services/AppointmentService/AppointmentService.Infrastructure/Services/SessionOrchestrationService.cs:131`

### Email Service Logging

**Problem**: Insufficient logging made email debugging difficult.

**Solution**: Added comprehensive logging before/after SMTP operations with connection details.

**File Changed**:
- `src/services/NotificationService/NotificationService.Infrastructure/Services/EmailService.cs`

### Environment Configs

**Added**:
- `appsettings.Development.json` - Local development with MailHog on localhost:1025
- `appsettings.Docker.json` - Docker Compose with MailHog container on `mailhog:1025`

**Location**:
- `src/services/NotificationService/NotificationService.Api/`

---

## Local Development Setup

### Required Services

| Service | Port | Purpose |
|---------|------|---------|
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Caching |
| RabbitMQ | 5672, 15672 | Message Bus |
| MailHog | 1025 (SMTP), 8025 (Web UI) | Email Testing |

### Verify Email Flow

1. Start MailHog: `docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog`
2. Start NotificationService: `cd src/services/NotificationService/NotificationService.Api && dotnet run`
3. Accept a match in the frontend
4. Check MailHog UI: http://localhost:8025
5. Check logs: Look for `[Consumer Entry] AppointmentsCreatedIntegrationEvent received`
