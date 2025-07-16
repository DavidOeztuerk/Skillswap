using Events.Infrastructure;

namespace Events.Integration.UserManagement;

/// <summary>
/// Integration event raised when a new user registers
/// </summary>
[EventVersion(1, Description = "Initial user registration event")]
public class UserRegisteredEvent : BaseEvent
{
    public UserRegisteredEvent(string email, string firstName, string lastName, string? correlationId = null)
        : base(correlationId, null)
    {
        Email = email;
        FirstName = firstName;
        LastName = lastName;
    }

    public string Email { get; private set; }
    public string FirstName { get; private set; }
    public string LastName { get; private set; }
}
