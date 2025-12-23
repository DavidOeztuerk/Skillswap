using MatchmakingService.Domain.Services;
using Microsoft.Extensions.Logging;

namespace MatchmakingService.Infrastructure.Services;

/// <summary>
/// Service for looking up skill information from the SkillService.
/// </summary>
public class SkillLookupService : ISkillLookupService
{
    private readonly ISkillServiceClient _skillServiceClient;
    private readonly ILogger<SkillLookupService> _logger;

    public SkillLookupService(ISkillServiceClient skillServiceClient, ILogger<SkillLookupService> logger)
    {
        _skillServiceClient = skillServiceClient;
        _logger = logger;
    }

    public async Task<string?> GetSkillNameAsync(string skillId, CancellationToken cancellationToken = default)
    {
        try
        {
            return await _skillServiceClient.GetSkillNameAsync(skillId, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error looking up skill {SkillId}", skillId);
            return null;
        }
    }

    public async Task<Dictionary<string, string>> GetSkillNamesAsync(List<string> skillIds, CancellationToken cancellationToken = default)
    {
        var result = new Dictionary<string, string>();

        foreach (var skillId in skillIds)
        {
            var skillName = await GetSkillNameAsync(skillId, cancellationToken);
            if (skillName != null)
            {
                result[skillId] = skillName;
            }
        }

        return result;
    }
}
