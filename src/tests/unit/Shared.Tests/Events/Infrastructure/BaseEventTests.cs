using Events.Infrastructure;
using FluentAssertions;
using Xunit;

namespace Shared.Tests.Events.Infrastructure;

public class BaseEventTests
{
    private class TestEvent : BaseEvent
    {
        public TestEvent() : base() { }
        public TestEvent(string? correlationId, string? userId, Dictionary<string, object>? metadata = null)
            : base(correlationId, userId, metadata) { }
    }

    [Fact]
    public void DefaultConstructor_ShouldInitializePropertiesCorrectly()
    {
        // Act
        var @event = new TestEvent();

        // Assert
        @event.EventId.Should().NotBeEmpty();
        @event.EventType.Should().Be("TestEvent");
        @event.OccurredOn.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        @event.Version.Should().Be(1);
        @event.CorrelationId.Should().BeNull();
        @event.UserId.Should().BeNull();
        @event.Metadata.Should().BeNull();
    }

    [Fact]
    public void ParameterizedConstructor_ShouldSetPropertiesCorrectly()
    {
        // Arrange
        var correlationId = "test-correlation-id";
        var userId = "user-123";
        var metadata = new Dictionary<string, object>
        {
            { "key1", "value1" },
            { "key2", 42 }
        };

        // Act
        var @event = new TestEvent(correlationId, userId, metadata);

        // Assert
        @event.EventId.Should().NotBeEmpty();
        @event.EventType.Should().Be("TestEvent");
        @event.OccurredOn.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(1));
        @event.Version.Should().Be(1);
        @event.CorrelationId.Should().Be(correlationId);
        @event.UserId.Should().Be(userId);
        @event.Metadata.Should().BeEquivalentTo(metadata);
    }

    [Fact]
    public void ParameterizedConstructor_WithNullMetadata_ShouldCreateEmptyMetadata()
    {
        // Arrange
        var correlationId = "test-correlation-id";
        var userId = "user-123";

        // Act
        var @event = new TestEvent(correlationId, userId, null);

        // Assert
        @event.Metadata.Should().NotBeNull();
        @event.Metadata.Should().BeEmpty();
    }

    [Fact]
    public void SetCorrelationId_ShouldUpdateCorrelationId()
    {
        // Arrange
        var @event = new TestEvent();
        var newCorrelationId = "new-correlation-id";

        // Act
        @event.SetCorrelationId(newCorrelationId);

        // Assert
        @event.CorrelationId.Should().Be(newCorrelationId);
    }

    [Fact]
    public void SetUserId_ShouldUpdateUserId()
    {
        // Arrange
        var @event = new TestEvent();
        var newUserId = "new-user-id";

        // Act
        @event.SetUserId(newUserId);

        // Assert
        @event.UserId.Should().Be(newUserId);
    }

    [Fact]
    public void AddMetadata_WithNullMetadata_ShouldCreateMetadataAndAddValue()
    {
        // Arrange
        var @event = new TestEvent();
        var key = "testKey";
        var value = "testValue";

        // Act
        @event.AddMetadata(key, value);

        // Assert
        @event.Metadata.Should().NotBeNull();
        @event.Metadata.Should().HaveCount(1);
        @event.Metadata![key].Should().Be(value);
    }

    [Fact]
    public void AddMetadata_WithExistingMetadata_ShouldAddNewValue()
    {
        // Arrange
        var metadata = new Dictionary<string, object> { { "existing", "value" } };
        var @event = new TestEvent("corr-id", "user-id", metadata);
        var key = "newKey";
        var value = 123;

        // Act
        @event.AddMetadata(key, value);

        // Assert
        @event.Metadata.Should().HaveCount(2);
        @event.Metadata!["existing"].Should().Be("value");
        @event.Metadata[key].Should().Be(value);
    }

    [Fact]
    public void AddMetadata_WithExistingKey_ShouldOverwriteValue()
    {
        // Arrange
        var metadata = new Dictionary<string, object> { { "key", "oldValue" } };
        var @event = new TestEvent("corr-id", "user-id", metadata);
        var newValue = "newValue";

        // Act
        @event.AddMetadata("key", newValue);

        // Assert
        @event.Metadata.Should().HaveCount(1);
        @event.Metadata!["key"].Should().Be(newValue);
    }

    [Fact]
    public void EventId_ShouldBeUnique()
    {
        // Arrange & Act
        var event1 = new TestEvent();
        var event2 = new TestEvent();

        // Assert
        event1.EventId.Should().NotBe(event2.EventId);
    }

    [Fact]
    public void OccurredOn_ShouldBeInUtc()
    {
        // Act
        var @event = new TestEvent();

        // Assert
        @event.OccurredOn.Kind.Should().Be(DateTimeKind.Utc);
    }

    [Fact]
    public void AddMetadata_WithComplexObject_ShouldAddCorrectly()
    {
        // Arrange
        var @event = new TestEvent();
        var complexObject = new { Name = "Test", Value = 42, Nested = new { Inner = "Value" } };

        // Act
        @event.AddMetadata("complex", complexObject);

        // Assert
        @event.Metadata.Should().HaveCount(1);
        @event.Metadata!["complex"].Should().BeEquivalentTo(complexObject);
    }

    [Fact]
    public void Version_ShouldDefaultToOne()
    {
        // Act
        var @event = new TestEvent();

        // Assert
        @event.Version.Should().Be(1);
    }

    [Fact]
    public void EventType_ShouldMatchClassName()
    {
        // Act
        var @event = new TestEvent();

        // Assert
        @event.EventType.Should().Be(nameof(TestEvent));
        @event.EventType.Should().Be(@event.GetType().Name);
    }

    [Fact]
    public void BaseEvent_ShouldImplementIEvent()
    {
        // Act
        var @event = new TestEvent();

        // Assert
        @event.Should().BeAssignableTo<IEvent>();
    }

    [Fact]
    public void Constructor_WithNullCorrelationIdAndUserId_ShouldAllowNullValues()
    {
        // Act
        var @event = new TestEvent(null, null);

        // Assert
        @event.CorrelationId.Should().BeNull();
        @event.UserId.Should().BeNull();
        @event.Metadata.Should().NotBeNull();
        @event.Metadata.Should().BeEmpty();
    }

    [Fact]
    public void AddMetadata_MultipleTimes_ShouldAccumulateValues()
    {
        // Arrange
        var @event = new TestEvent();

        // Act
        @event.AddMetadata("key1", "value1");
        @event.AddMetadata("key2", 42);
        @event.AddMetadata("key3", true);
        @event.AddMetadata("key4", DateTime.UtcNow);

        // Assert
        @event.Metadata.Should().HaveCount(4);
        @event.Metadata!["key1"].Should().Be("value1");
        @event.Metadata["key2"].Should().Be(42);
        @event.Metadata["key3"].Should().Be(true);
        @event.Metadata["key4"].Should().BeOfType<DateTime>();
    }
}