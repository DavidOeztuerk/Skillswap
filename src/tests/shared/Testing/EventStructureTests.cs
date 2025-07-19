//using Xunit;
//using System.Reflection;
//using System.IO;
//using FluentAssertions;

//namespace Testing;

//public class EventStructureTests
//{
//    private readonly string _eventsPath = "/home/ditss/Source/Repos/Skillswap/src/shared/Events";

//    [Fact]
//    public void Events_Should_BeOrganizedInProperFolderStructure()
//    {
//        // Arrange
//        var expectedFolders = new[]
//        {
//            "Domain",
//            "Integration", 
//            "Infrastructure",
//            "Security",
//            "Notification",
//            "Analytics"
//        };

//        // Act & Assert
//        foreach (var folder in expectedFolders)
//        {
//            var folderPath = Path.Combine(_eventsPath, folder);
//            Directory.Exists(folderPath).Should().BeTrue($"Folder {folder} should exist in Events directory");
//        }
//    }

//    [Fact]
//    public void DomainEvents_Should_BeOrganizedByService()
//    {
//        // Arrange
//        var expectedServiceFolders = new[]
//        {
//            "User",
//            "Skill", 
//            "Appointment",
//            "Matchmaking",
//            "VideoCall"
//        };

//        var domainPath = Path.Combine(_eventsPath, "Domain");

//        // Act & Assert
//        foreach (var service in expectedServiceFolders)
//        {
//            var servicePath = Path.Combine(domainPath, service);
//            Directory.Exists(servicePath).Should().BeTrue($"Domain/{service} folder should exist");
//        }
//    }

//    [Fact]
//    public void IntegrationEvents_Should_BeOrganizedByCategory()
//    {
//        // Arrange
//        var expectedCategories = new[]
//        {
//            "UserManagement",
//            "SkillManagement",
//            "AppointmentManagement", 
//            "Communication",
//            "Security",
//            "Compliance"
//        };

//        var integrationPath = Path.Combine(_eventsPath, "Integration");

//        // Act & Assert
//        foreach (var category in expectedCategories)
//        {
//            var categoryPath = Path.Combine(integrationPath, category);
//            Directory.Exists(categoryPath).Should().BeTrue($"Integration/{category} folder should exist");
//        }
//    }

//    [Fact]
//    public void SecurityEvents_Should_BeOrganizedByType()
//    {
//        // Arrange
//        var expectedSecurityTypes = new[]
//        {
//            "Authentication",
//            "Authorization", 
//            "ThreatDetection",
//            "DataAccess"
//        };

//        var securityPath = Path.Combine(_eventsPath, "Security");

//        // Act & Assert
//        foreach (var type in expectedSecurityTypes)
//        {
//            var typePath = Path.Combine(securityPath, type);
//            Directory.Exists(typePath).Should().BeTrue($"Security/{type} folder should exist");
//        }
//    }

//    [Fact]
//    public void AllEvents_Should_ImplementIEvent()
//    {
//        // Arrange
//        var eventFiles = Directory.GetFiles(_eventsPath, "*Event.cs", SearchOption.AllDirectories);

//        // Act & Assert
//        eventFiles.Should().NotBeEmpty("There should be event files in the Events directory");

//        foreach (var eventFile in eventFiles)
//        {
//            var content = File.ReadAllText(eventFile);
//            var fileName = Path.GetFileNameWithoutExtension(eventFile);
            
//            // Should implement IEvent interface or inherit from base event
//            (content.Should().Contain(": IEvent") | content.Should().Contain(": IDomainEvent") | content.Should().Contain(": BaseEvent"))
//                .Which.Should().NotBeNull($"Event {fileName} should implement an event interface");
//        }
//    }

//    [Fact]
//    public void DomainEvents_Should_HaveProperNaming()
//    {
//        // Arrange
//        var domainPath = Path.Combine(_eventsPath, "Domain");
//        if (!Directory.Exists(domainPath)) return;

//        var domainEventFiles = Directory.GetFiles(domainPath, "*.cs", SearchOption.AllDirectories);

//        // Act & Assert
//        foreach (var eventFile in domainEventFiles)
//        {
//            var fileName = Path.GetFileNameWithoutExtension(eventFile);
//            fileName.Should().EndWith("DomainEvent", $"Domain event {fileName} should end with 'DomainEvent'");
//        }
//    }

//    [Fact]
//    public void IntegrationEvents_Should_HaveProperNaming()
//    {
//        // Arrange
//        var integrationPath = Path.Combine(_eventsPath, "Integration");
//        if (!Directory.Exists(integrationPath)) return;

//        var integrationEventFiles = Directory.GetFiles(integrationPath, "*.cs", SearchOption.AllDirectories);

//        // Act & Assert
//        foreach (var eventFile in integrationEventFiles)
//        {
//            var fileName = Path.GetFileNameWithoutExtension(eventFile);
//            fileName.Should().EndWith("Event", $"Integration event {fileName} should end with 'Event'");
//        }
//    }

//    [Fact]
//    public void Events_Should_HaveVersioningSupport()
//    {
//        // Arrange
//        var eventFiles = Directory.GetFiles(_eventsPath, "*Event.cs", SearchOption.AllDirectories);

//        // Act & Assert
//        foreach (var eventFile in eventFiles)
//        {
//            var content = File.ReadAllText(eventFile);
//            var fileName = Path.GetFileNameWithoutExtension(eventFile);
            
//            // Should have Version property or EventVersion attribute
//            (content.Should().Contain("Version") | content.Should().Contain("EventVersion"))
//                .Which.Should().NotBeNull($"Event {fileName} should support versioning");
//        }
//    }

//    [Fact]
//    public void Events_Should_HaveRequiredProperties()
//    {
//        // Arrange
//        var eventFiles = Directory.GetFiles(_eventsPath, "*Event.cs", SearchOption.AllDirectories);

//        // Act & Assert
//        foreach (var eventFile in eventFiles)
//        {
//            var content = File.ReadAllText(eventFile);
//            var fileName = Path.GetFileNameWithoutExtension(eventFile);
            
//            // Should have EventId, OccurredOn, and EventType
//            content.Should().Contain("EventId", $"Event {fileName} should have EventId property");
//            content.Should().Contain("OccurredOn", $"Event {fileName} should have OccurredOn property");
//            content.Should().Contain("EventType", $"Event {fileName} should have EventType property");
//        }
//    }
//}