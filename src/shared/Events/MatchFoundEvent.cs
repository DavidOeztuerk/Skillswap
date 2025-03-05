namespace Events;

public record MatchFoundEvent(
    string MatchSessionId,
    string SkillName,
    string SkillSearcherId,
    string SkillCreatorId);
