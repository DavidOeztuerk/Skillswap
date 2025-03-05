namespace Events;

public record MatchFoundEvent(
    Guid MatchSessionId,
    string SkillName);
