namespace Events.Integration.SkillManagement;

public record SkillCreatedEvent(
    string SkillId,
    string Name,
    string Description,
    bool IsOffering,
    string SkillCreatorId);
