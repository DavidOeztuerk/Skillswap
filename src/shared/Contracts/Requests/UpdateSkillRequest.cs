namespace Contracts.Requests;

public record UpdateSkillRequest(
    string Name,
    string Description,
    bool IsOffering,
    string SkillCategoryId,
    string ProficiencyLevelId
);
