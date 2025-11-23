namespace MatchmakingService.Domain.Services;

/// <summary>
/// Service interface for skill lookup operations.
/// </summary>
public interface ISkillLookupService
{
    Task<string?> GetSkillNameAsync(string skillId, CancellationToken cancellationToken = default);
    Task<Dictionary<string, string>> GetSkillNamesAsync(List<string> skillIds, CancellationToken cancellationToken = default);
}

/// <summary>
/// Response model for skill lookup.
/// </summary>
public record SkillLookupResponse(
    string SkillId,
    string Name,
    string UserId,
    string Category,
    string ProficiencyLevel
);
