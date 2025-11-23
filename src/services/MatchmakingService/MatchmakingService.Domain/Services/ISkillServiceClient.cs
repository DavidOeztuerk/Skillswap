namespace MatchmakingService.Domain.Services;

/// <summary>
/// Service client interface for skill-related operations.
/// </summary>
public interface ISkillServiceClient
{
    Task<string> GetSkillNameAsync(string skillId, CancellationToken cancellationToken = default);
    Task<string> GetSkillCategoryAsync(string skillId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Batch fetch skill details by skill IDs to avoid N+1 queries.
    /// </summary>
    Task<Dictionary<string, SkillDetailsBatch>> GetSkillDetailsBatchAsync(IEnumerable<string> skillIds, CancellationToken cancellationToken = default);
}

/// <summary>
/// Lightweight skill details data for batch operations
/// </summary>
public record SkillDetailsBatch(
    string SkillId,
    string Name,
    string CategoryName);
