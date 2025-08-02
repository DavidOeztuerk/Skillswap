namespace Events.Integration.SkillManagement;

public record SkillDeletedEvent(
    string SkillId,
    string UserId,
    string SkillName,
    string Reason);