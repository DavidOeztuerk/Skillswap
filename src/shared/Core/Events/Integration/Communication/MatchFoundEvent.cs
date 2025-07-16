namespace Events.Integration.Communication;

public record MatchFoundEvent(
    string MatchSessionId,
    string SkillName,
    string SkillSearcherId,
    string SkillCreatorId);
