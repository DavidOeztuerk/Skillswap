namespace Events.Integration.UserManagement;

public record UserRoleChangedEvent(
    string UserId,
    string Email,
    List<string> OldRoles,
    List<string> NewRoles,
    string ChangedBy);
