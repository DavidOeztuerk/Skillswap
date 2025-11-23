namespace MatchmakingService.Infrastructure.Services;

// public interface ISkillLookupService
// {
//     Task<SkillLookupResponse?> GetSkillAsync(string skillId, CancellationToken cancellationToken = default);
// }

public record SkillLookupResponse(
    string SkillId,
    string Name,
    string UserId,
    string Category,
    string ProficiencyLevel
);