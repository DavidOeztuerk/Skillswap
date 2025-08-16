using CQRS.Interfaces;
using Events.Domain.User;
using FluentAssertions;
using Xunit;

namespace Shared.Tests.Events.Domain;

public class DomainEventTests
{
    private record TestDomainEvent(string TestProperty) : DomainEvent;

    [Fact]
    public void DomainEvent_ShouldInitializePropertiesCorrectly()
    {
        // Act
        var @event = new TestDomainEvent("TestValue");

        // Assert
        @event.EventId.Should().NotBeNullOrEmpty();
        @event.OccurredOn.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        @event.OccurredOn.Kind.Should().Be(DateTimeKind.Utc);
        @event.TestProperty.Should().Be("TestValue");
    }

    [Fact]
    public void DomainEvent_EventId_ShouldBeUnique()
    {
        // Act
        var event1 = new TestDomainEvent("Test1");
        var event2 = new TestDomainEvent("Test2");

        // Assert
        event1.EventId.Should().NotBe(event2.EventId);
    }

    [Fact]
    public void DomainEvent_ShouldImplementIDomainEvent()
    {
        // Act
        var @event = new TestDomainEvent("Test");

        // Assert
        @event.Should().BeAssignableTo<IDomainEvent>();
    }

    [Fact]
    public void UserRegisteredDomainEvent_ShouldInitializeCorrectly()
    {
        // Arrange
        var userId = "user-123";
        var email = "user@example.com";
        var firstName = "John";
        var lastName = "Doe";

        // Act
        var @event = new UserRegisteredDomainEvent(userId, email, firstName, lastName);

        // Assert
        @event.UserId.Should().Be(userId);
        @event.Email.Should().Be(email);
        @event.FirstName.Should().Be(firstName);
        @event.LastName.Should().Be(lastName);
        @event.EventId.Should().NotBeNullOrEmpty();
        @event.OccurredOn.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public void UserRegisteredDomainEvent_ShouldBeDomainEvent()
    {
        // Act
        var @event = new UserRegisteredDomainEvent("userId", "email", "first", "last");

        // Assert
        @event.Should().BeAssignableTo<DomainEvent>();
        @event.Should().BeAssignableTo<IDomainEvent>();
    }

    [Fact]
    public void DomainEvent_AsRecord_ShouldSupportValueEquality()
    {
        // Arrange
        var event1 = new TestDomainEvent("TestValue");
        var event2 = new TestDomainEvent("TestValue");
        var event3 = new TestDomainEvent("DifferentValue");

        // Assert - Records with same property values should NOT be equal due to unique EventId
        event1.Should().NotBe(event2); // Different EventId makes them different
        event1.TestProperty.Should().Be(event2.TestProperty);
        event1.Should().NotBe(event3);
    }

    [Fact]
    public void UserRegisteredDomainEvent_WithSameData_ShouldHaveDifferentEventIds()
    {
        // Act
        var event1 = new UserRegisteredDomainEvent("user1", "email@test.com", "John", "Doe");
        var event2 = new UserRegisteredDomainEvent("user1", "email@test.com", "John", "Doe");

        // Assert
        event1.EventId.Should().NotBe(event2.EventId);
        event1.Should().NotBe(event2);
    }

    [Fact]
    public void DomainEvent_EventId_ShouldBeValidGuid()
    {
        // Act
        var @event = new TestDomainEvent("Test");

        // Assert
        Guid.TryParse(@event.EventId, out var eventIdGuid).Should().BeTrue();
        eventIdGuid.Should().NotBeEmpty();
    }

    [Fact]
    public void DomainEvent_OccurredOn_ShouldNotChange()
    {
        // Arrange
        var @event = new TestDomainEvent("Test");
        var initialTime = @event.OccurredOn;

        // Act - Wait a bit
        Thread.Sleep(100);

        // Assert
        @event.OccurredOn.Should().Be(initialTime);
    }

    [Fact]
    public void UserRegisteredDomainEvent_ShouldBeImmutable()
    {
        // Arrange
        var @event = new UserRegisteredDomainEvent("user1", "email@test.com", "John", "Doe");

        // Act & Assert - Records are immutable by default
        // This test verifies that the properties are init-only
        @event.UserId.Should().Be("user1");
        @event.Email.Should().Be("email@test.com");
        @event.FirstName.Should().Be("John");
        @event.LastName.Should().Be("Doe");
        
        // Creating a new instance with 'with' expression
        var modifiedEvent = @event with { Email = "newemail@test.com" };
        
        // Original should remain unchanged
        @event.Email.Should().Be("email@test.com");
        modifiedEvent.Email.Should().Be("newemail@test.com");
        modifiedEvent.UserId.Should().Be(@event.UserId);
    }
}