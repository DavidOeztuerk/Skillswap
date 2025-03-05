namespace Contracts.Responses;

public record FindMatchResponse(
    Guid MatchSessionId,
    string SkillName);
