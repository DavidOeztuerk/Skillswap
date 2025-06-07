namespace Events;

public record UserDeletedEvent(
    string UserId,
    string Email,
    string DeletedBy,
    string Reason);
