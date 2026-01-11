namespace Events.Integration.SkillManagement;

/// <summary>
/// Integration event published when a listing has expired.
/// </summary>
public record ListingExpiredIntegrationEvent
{
  public string ListingId { get; init; } = string.Empty;
  public string SkillId { get; init; } = string.Empty;
  public string UserId { get; init; } = string.Empty;
  public string UserEmail { get; init; } = string.Empty;
  public string UserFirstName { get; init; } = string.Empty;
  public string SkillName { get; init; } = string.Empty;
  public DateTime ExpiredAt { get; init; } = DateTime.UtcNow;
  public DateTime OccurredAt { get; init; } = DateTime.UtcNow;
}
