namespace Events.Infrastructure;

/// <summary>
/// Base interface for all events in the system
/// </summary>
public interface IEvent
{
    /// <summary>
    /// Unique identifier for this event instance
    /// </summary>
    Guid EventId { get; }
    
    /// <summary>
    /// The type of event (used for serialization/deserialization)
    /// </summary>
    string EventType { get; }
    
    /// <summary>
    /// When the event occurred
    /// </summary>
    DateTime OccurredOn { get; }
    
    /// <summary>
    /// Version of the event schema (for backwards compatibility)
    /// </summary>
    int Version { get; }
    
    /// <summary>
    /// Optional correlation ID for tracing related events
    /// </summary>
    string? CorrelationId { get; }
    
    /// <summary>
    /// User ID who triggered the event (if applicable)
    /// </summary>
    string? UserId { get; }
    
    /// <summary>
    /// Additional metadata about the event
    /// </summary>
    Dictionary<string, object>? Metadata { get; }
}