using Events.Infrastructure;

namespace Events.Security.Authentication;

/// <summary>
/// Security event raised when multiple failed login attempts are detected
/// </summary>
[EventVersion(1, Description = "Multiple failed login attempts detection")]
public class MultipleFailedLoginAttemptsEvent : BaseEvent
{
    public MultipleFailedLoginAttemptsEvent(
        string email,
        string ipAddress,
        int attemptCount,
        DateTime windowStart,
        DateTime windowEnd,
        string? correlationId = null)
        : base(correlationId, null)
    {
        Email = email;
        IpAddress = ipAddress;
        AttemptCount = attemptCount;
        WindowStart = windowStart;
        WindowEnd = windowEnd;
        
        // Add security-specific metadata
        AddMetadata("SecurityLevel", "High");
        AddMetadata("ThreatType", "BruteForce");
        AddMetadata("RequiresImmediateAction", true);
    }

    public string Email { get; private set; }
    public string IpAddress { get; private set; }
    public int AttemptCount { get; private set; }
    public DateTime WindowStart { get; private set; }
    public DateTime WindowEnd { get; private set; }
}
