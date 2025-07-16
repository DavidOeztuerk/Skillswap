namespace Contracts.Requests;

public record CreateSkillRequest(
    string Name,
    string Description,
    bool IsOffering,
    string SkillCategoryId,
    string ProficiencyLevelId);
