namespace UserService.Domain.Events;

public class UserRoleUpdatedEvent
{
    public string? UserId { get; set; }
    public string? NewRole { get; set; }
    public DateTime UpdatedAt { get; set; }
}