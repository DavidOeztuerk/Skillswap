namespace Events;

public record SkillCreatedEvent(
    string SkillId,
    string Name,
    string Description,
    bool IsOffering);
