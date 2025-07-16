using Events.Infrastructure;

namespace Events.Integration.UserManagement;

/// <summary>
/// Integration event raised when a user's profile is updated
/// </summary>
[EventVersion(1, Description = "User profile update event")]
public class UserProfileUpdatedEvent : BaseEvent
{
    public UserProfileUpdatedEvent(
        string userId,
        string email,
        string firstName,
        string lastName,
        Dictionary<string, string> changedFields,
        string? correlationId = null)
        : base(correlationId, userId)
    {
        Email = email;
        FirstName = firstName;
        LastName = lastName;
        ChangedFields = changedFields ?? new Dictionary<string, string>();
    }

    public string Email { get; private set; }
    public string FirstName { get; private set; }
    public string LastName { get; private set; }
    public Dictionary<string, string> ChangedFields { get; private set; }
}
