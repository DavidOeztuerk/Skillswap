namespace Events.Integration.Matchmaking;

/// <summary>
/// Integration event published when a match is completed.
/// Consumed by UserService to update user statistics.
/// </summary>
public record MatchCompletedIntegrationEvent(
    string MatchId,
    string OfferingUserId,
    string RequestingUserId,
    DateTime CompletedAt,
    DateTime PublishedAt);
