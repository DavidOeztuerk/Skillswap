using CQRS.Interfaces;

namespace UserService.Application.Queries;

public record GetEmailVerificationStatusQuery(
    string UserId)
    : IQuery<EmailVerificationStatusResponse>, ICacheableQuery
{
    public string CacheKey => $"email-verificaion-status:{UserId}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(2);
}

public class EmailVerificationStatusResponse
{
    public bool EmailVerified { get; set; }
    public DateTime? CooldownUntil { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public DateTime? SentAt { get; set; }
    public int AttemptsCount { get; set; }
    public bool CanResend => CooldownUntil == null || DateTime.UtcNow >= CooldownUntil;
}