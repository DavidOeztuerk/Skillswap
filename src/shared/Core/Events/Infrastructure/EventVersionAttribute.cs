namespace Events.Infrastructure;

/// <summary>
/// Attribute to mark event versions for backwards compatibility
/// </summary>
[AttributeUsage(AttributeTargets.Class)]
public class EventVersionAttribute : Attribute
{
    public int Version { get; }
    public string? Description { get; set; }

    public EventVersionAttribute(int version)
    {
        Version = version;
    }
}