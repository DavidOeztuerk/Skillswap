namespace UserService.Domain.Events;

public class PhoneVerifiedEvent
{
    public string UserId { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public DateTime VerifiedAt { get; set; }
    public DateTime Timestamp { get; set; }
}