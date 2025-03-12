namespace Contracts.Requests;

public record UpdateUserSkillRequest(
    string Name,
    string Description,
    bool IsOffering,
    string CategoryId,
    string ProficiencyLevelId
);
