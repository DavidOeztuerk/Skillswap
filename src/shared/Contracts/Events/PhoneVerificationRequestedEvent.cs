namespace Contracts.Events;

public class PhoneVerificationRequestedEvent
{
    public string UserId { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string VerificationCode { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime Timestamp { get; set; }
}