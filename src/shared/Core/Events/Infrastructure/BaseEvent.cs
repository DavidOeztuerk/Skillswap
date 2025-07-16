namespace Events.Infrastructure;

/// <summary>
/// Base implementation for all events
/// </summary>
public abstract class BaseEvent : IEvent
{
    protected BaseEvent()
    {
        EventId = Guid.NewGuid();
        OccurredOn = DateTime.UtcNow;
        EventType = GetType().Name;
        Version = 1; // Default version
    }

    protected BaseEvent(string? correlationId, string? userId, Dictionary<string, object>? metadata = null) : this()
    {
        CorrelationId = correlationId;
        UserId = userId;
        Metadata = metadata ?? new Dictionary<string, object>();
    }

    public Guid EventId { get; private set; }
    public string EventType { get; private set; }
    public DateTime OccurredOn { get; private set; }
    public virtual int Version { get; protected set; } = 1;
    public string? CorrelationId { get; private set; }
    public string? UserId { get; private set; }
    public Dictionary<string, object>? Metadata { get; private set; }
    
    /// <summary>
    /// Updates the correlation ID for this event
    /// </summary>
    public void SetCorrelationId(string correlationId)
    {
        CorrelationId = correlationId;
    }
    
    /// <summary>
    /// Updates the user ID for this event
    /// </summary>
    public void SetUserId(string userId)
    {
        UserId = userId;
    }
    
    /// <summary>
    /// Adds metadata to the event
    /// </summary>
    public void AddMetadata(string key, object value)
    {
        Metadata ??= new Dictionary<string, object>();
        Metadata[key] = value;
    }
}