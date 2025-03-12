namespace Contracts.Responses;
public record CreateSkillResponse(
    string SkillId,
    string Name,
    string Description,
    bool IsOffering,
    string CategoryId,
    string PoficiencyLevelId);
