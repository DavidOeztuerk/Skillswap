namespace Events.Integration.Matchmaking;

public record MatchDissolvedIntegrationEvent(
    string MatchId,
    string OfferingUserId,
    string RequestingUserId,
    string? Reason);