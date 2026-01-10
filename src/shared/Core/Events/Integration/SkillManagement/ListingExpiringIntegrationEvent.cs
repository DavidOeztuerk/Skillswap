namespace Events.Integration.SkillManagement;

/// <summary>
/// Integration event published when a listing is approaching expiration.
/// Phase 10: Listing concept with expiration
/// </summary>
public record ListingExpiringIntegrationEvent
{
    public string ListingId { get; init; } = string.Empty;
    public string SkillId { get; init; } = string.Empty;
    public string UserId { get; init; } = string.Empty;
    public string UserEmail { get; init; } = string.Empty;
    public string UserFirstName { get; init; } = string.Empty;
    public string SkillName { get; init; } = string.Empty;
    public DateTime ExpiresAt { get; init; }
    public int DaysRemaining { get; init; }
    public DateTime OccurredAt { get; init; } = DateTime.UtcNow;
}
