namespace Contracts.Responses;

public record UpdateUserSkillResponse(
    string Id,
    string Name,
    string Description,
    bool IsOffering,
    string CategoryId,
    string ProficiencyLevelId
);
