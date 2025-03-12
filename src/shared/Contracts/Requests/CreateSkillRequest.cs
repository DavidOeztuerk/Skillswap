namespace Contracts.Requests;

public record CreateSkillRequest(
    string Name,
    string Description,
    bool IsOffering,
    string CategoryId,
    string ProficiencyLevelId);
