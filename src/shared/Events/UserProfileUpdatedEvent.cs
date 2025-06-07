namespace Events;

public record UserProfileUpdatedEvent(
    string UserId,
    string Email,
    string FirstName,
    string LastName,
    Dictionary<string, string> ChangedFields);
