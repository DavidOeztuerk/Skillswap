//using Xunit;
//using System.IO;
//using FluentAssertions;
//using System.Linq;

//namespace Testing;

//public class EventMigrationTests
//{
//    private readonly string _oldEventsPath = "/home/ditss/Source/Repos/Skillswap/src/shared/Events";
//    private readonly string _newEventsPath = "/home/ditss/Source/Repos/Skillswap/src/shared/Events";

//    [Fact]
//    public void AllOriginalEvents_Should_BeMigrated()
//    {
//        // Arrange
//        var originalEventFiles = new[]
//        {
//            "AccountLockoutEvent.cs",
//            "AccountReactivatedNotificationEvent.cs", 
//            "AccountSuspendedNotificationEvent.cs",
//            "AdminActionPerformedEvent.cs",
//            "AppointmentAcceptedEvent.cs",
//            "AppointmentCreatedEvent.cs",
//            "BulkUserOperationEvent.cs",
//            "CallAcceptedEvent.cs",
//            "CallInitiatedEvent.cs",
//            "CallTerminatedEvent.cs",
//            "DataPortabilityRequestEvent.cs",
//            "DataRetentionPolicyAppliedEvent.cs",
//            "EmailVerificationRequestedEvent.cs",
//            "LoginFromNewDeviceEvent.cs",
//            "LoginFromNewLocationEvent.cs",
//            "MatchFoundEvent.cs",
//            "MeetingScheduledEvent.cs",
//            "MessageSentEvent.cs",
//            "MultipleFailedLoginAttemptsEvent.cs",
//            "PasswordChangedNotificationEvent.cs",
//            "PasswordResetCompletedNotificationEvent.cs",
//            "PasswordResetEmailEvent.cs",
//            "RefreshTokenRevokedEvent.cs",
//            "SecurityAlertEvent.cs",
//            "SkillCreatedEvent.cs",
//            "SuspiciousActivityDetectedEvent.cs",
//            "UserAccountStatusChangedEvent.cs",
//            "UserBehaviorEvent.cs",
//            "UserConsentUpdatedEvent.cs",
//            "UserCreatedForIntegrationEvent.cs",
//            "UserDataAccessedEvent.cs",
//            "UserDataDeletedEvent.cs",
//            "UserDataExportedEvent.cs",
//            "UserDeactivatedForIntegrationEvent.cs",
//            "UserDeletedEvent.cs",
//            "UserEmailVerifiedEvent.cs",
//            "UserEngagementEvent.cs",
//            "UserLoggedOutEvent.cs",
//            "UserProfileUpdatedEvent.cs",
//            "UserRegisteredEvent.cs",
//            "UserRoleChangedEvent.cs",
//            "UserSessionEndedEvent.cs",
//            "UserSessionStartedEvent.cs",
//            "UserUpdatedForIntegrationEvent.cs",
//            "WelcomeEmailEvent.cs"
//        };

//        // Act & Assert
//        foreach (var eventFile in originalEventFiles)
//        {
//            var newLocation = FindEventInNewStructure(eventFile);
//            newLocation.Should().NotBeNull($"Event {eventFile} should be migrated to new structure");
            
//            if (newLocation != null)
//            {
//                File.Exists(newLocation).Should().BeTrue($"Event {eventFile} should exist at {newLocation}");
//            }
//        }
//    }

//    [Fact]
//    public void UserManagementEvents_Should_BeMigratedCorrectly()
//    {
//        // Arrange
//        var userEvents = new[]
//        {
//            "UserRegisteredEvent.cs",
//            "UserProfileUpdatedEvent.cs",
//            "UserDeletedEvent.cs",
//            "UserEmailVerifiedEvent.cs",
//            "UserLoggedOutEvent.cs",
//            "UserCreatedForIntegrationEvent.cs",
//            "UserDeactivatedForIntegrationEvent.cs",
//            "UserUpdatedForIntegrationEvent.cs",
//            "UserAccountStatusChangedEvent.cs",
//            "UserRoleChangedEvent.cs"
//        };

//        var expectedPath = Path.Combine(_newEventsPath, "Integration", "UserManagement");

//        // Act & Assert
//        foreach (var eventFile in userEvents)
//        {
//            var filePath = Path.Combine(expectedPath, eventFile);
//            File.Exists(filePath).Should().BeTrue($"User event {eventFile} should be at {filePath}");
//        }
//    }

//    [Fact]
//    public void SecurityEvents_Should_BeMigratedCorrectly()
//    {
//        // Arrange
//        var authEvents = new[]
//        {
//            "LoginFromNewDeviceEvent.cs",
//            "LoginFromNewLocationEvent.cs", 
//            "MultipleFailedLoginAttemptsEvent.cs",
//            "RefreshTokenRevokedEvent.cs",
//            "PasswordChangedNotificationEvent.cs",
//            "PasswordResetEmailEvent.cs",
//            "PasswordResetCompletedNotificationEvent.cs"
//        };

//        var threatEvents = new[]
//        {
//            "SuspiciousActivityDetectedEvent.cs",
//            "SecurityAlertEvent.cs",
//            "AccountLockoutEvent.cs"
//        };

//        var dataAccessEvents = new[]
//        {
//            "UserDataAccessedEvent.cs",
//            "UserDataDeletedEvent.cs",
//            "UserDataExportedEvent.cs"
//        };

//        // Act & Assert
//        var authPath = Path.Combine(_newEventsPath, "Security", "Authentication");
//        var threatPath = Path.Combine(_newEventsPath, "Security", "ThreatDetection");
//        var dataPath = Path.Combine(_newEventsPath, "Security", "DataAccess");

//        foreach (var eventFile in authEvents)
//        {
//            var filePath = Path.Combine(authPath, eventFile);
//            File.Exists(filePath).Should().BeTrue($"Auth event {eventFile} should be at {filePath}");
//        }

//        foreach (var eventFile in threatEvents)
//        {
//            var filePath = Path.Combine(threatPath, eventFile);
//            File.Exists(filePath).Should().BeTrue($"Threat event {eventFile} should be at {filePath}");
//        }

//        foreach (var eventFile in dataAccessEvents)
//        {
//            var filePath = Path.Combine(dataPath, eventFile);
//            File.Exists(filePath).Should().BeTrue($"Data access event {eventFile} should be at {filePath}");
//        }
//    }

//    [Fact]
//    public void ComplianceEvents_Should_BeMigratedCorrectly()
//    {
//        // Arrange
//        var complianceEvents = new[]
//        {
//            "DataPortabilityRequestEvent.cs",
//            "DataRetentionPolicyAppliedEvent.cs",
//            "UserConsentUpdatedEvent.cs"
//        };

//        var expectedPath = Path.Combine(_newEventsPath, "Integration", "Compliance");

//        // Act & Assert
//        foreach (var eventFile in complianceEvents)
//        {
//            var filePath = Path.Combine(expectedPath, eventFile);
//            File.Exists(filePath).Should().BeTrue($"Compliance event {eventFile} should be at {filePath}");
//        }
//    }

//    [Fact]
//    public void NotificationEvents_Should_BeMigratedCorrectly()
//    {
//        // Arrange
//        var notificationEvents = new[]
//        {
//            "AccountReactivatedNotificationEvent.cs",
//            "AccountSuspendedNotificationEvent.cs", 
//            "WelcomeEmailEvent.cs"
//        };

//        var expectedPath = Path.Combine(_newEventsPath, "Notification");

//        // Act & Assert
//        foreach (var eventFile in notificationEvents)
//        {
//            var filePath = Path.Combine(expectedPath, eventFile);
//            File.Exists(filePath).Should().BeTrue($"Notification event {eventFile} should be at {filePath}");
//        }
//    }

//    [Fact]
//    public void AnalyticsEvents_Should_BeMigratedCorrectly()
//    {
//        // Arrange
//        var analyticsEvents = new[]
//        {
//            "UserBehaviorEvent.cs",
//            "UserEngagementEvent.cs",
//            "UserSessionStartedEvent.cs",
//            "UserSessionEndedEvent.cs",
//            "AdminActionPerformedEvent.cs",
//            "BulkUserOperationEvent.cs"
//        };

//        var expectedPath = Path.Combine(_newEventsPath, "Analytics");

//        // Act & Assert
//        foreach (var eventFile in analyticsEvents)
//        {
//            var filePath = Path.Combine(expectedPath, eventFile);
//            File.Exists(filePath).Should().BeTrue($"Analytics event {eventFile} should be at {filePath}");
//        }
//    }

//    private string? FindEventInNewStructure(string eventFileName)
//    {
//        if (!Directory.Exists(_newEventsPath)) return null;

//        var files = Directory.GetFiles(_newEventsPath, eventFileName, SearchOption.AllDirectories);
//        return files.FirstOrDefault();
//    }
//}