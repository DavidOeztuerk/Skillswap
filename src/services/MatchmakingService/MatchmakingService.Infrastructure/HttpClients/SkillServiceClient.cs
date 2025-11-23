using Infrastructure.Communication;
using Contracts.Skill.Responses;
using MatchmakingService.Domain.Services;
using Microsoft.Extensions.Logging;

namespace MatchmakingService.Infrastructure.HttpClients;

public class SkillServiceClient : ISkillServiceClient
{
    private readonly IServiceCommunicationManager _serviceCommunication;
    private readonly ILogger<SkillServiceClient> _logger;

    public SkillServiceClient(IServiceCommunicationManager serviceCommunication, ILogger<SkillServiceClient> logger)
    {
        _serviceCommunication = serviceCommunication;
        _logger = logger;
    }

    public async Task<string> GetSkillNameAsync(string skillId, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _serviceCommunication.GetAsync<GetSkillDetailsResponse>(
                "skillservice",
                $"api/skills/{skillId}",
                cancellationToken);

            if (response == null)
            {
                _logger.LogWarning("Failed to get skill {SkillId} from SkillService", skillId);
                return "Unknown Skill";
            }

            return response.Name ?? "Unknown Skill";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching skill {SkillId} from SkillService", skillId);
            return "Unknown Skill";
        }
    }

    public async Task<string> GetSkillCategoryAsync(string skillId, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await _serviceCommunication.GetAsync<GetSkillDetailsResponse>(
                "skillservice",
                $"api/skills/{skillId}",
                cancellationToken);

            if (response == null)
            {
                _logger.LogWarning("Failed to get skill category for {SkillId} from SkillService", skillId);
                return "General";
            }

            return response.Category?.Name ?? "General";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching skill category for {SkillId} from SkillService", skillId);
            return "General";
        }
    }

    public async Task<Dictionary<string, SkillDetailsBatch>> GetSkillDetailsBatchAsync(IEnumerable<string> skillIds, CancellationToken cancellationToken = default)
    {
        var result = new Dictionary<string, SkillDetailsBatch>();
        var distinctSkillIds = skillIds.Distinct().ToList();

        if (!distinctSkillIds.Any())
        {
            return result;
        }

        _logger.LogInformation("Batch fetching {Count} skill details", distinctSkillIds.Count);

        // Fetch all skill details concurrently with controlled parallelism
        var semaphore = new SemaphoreSlim(10); // Max 10 concurrent requests
        var tasks = distinctSkillIds.Select(async skillId =>
        {
            await semaphore.WaitAsync(cancellationToken);
            try
            {
                var response = await _serviceCommunication.GetAsync<GetSkillDetailsResponse>(
                    "skillservice",
                    $"api/skills/{skillId}",
                    cancellationToken);

                if (response != null)
                {
                    return new SkillDetailsBatch(
                        SkillId: skillId,
                        Name: response.Name ?? "Unknown Skill",
                        CategoryName: response.Category?.Name ?? "General"
                    );
                }

                _logger.LogWarning("Failed to fetch skill details for {SkillId}", skillId);
                return new SkillDetailsBatch(
                    SkillId: skillId,
                    Name: "Unknown Skill",
                    CategoryName: "General"
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching skill details for {SkillId} in batch", skillId);
                return new SkillDetailsBatch(
                    SkillId: skillId,
                    Name: "Unknown Skill",
                    CategoryName: "General"
                );
            }
            finally
            {
                semaphore.Release();
            }
        });

        var skills = await Task.WhenAll(tasks);

        foreach (var skill in skills)
        {
            result[skill.SkillId] = skill;
        }

        _logger.LogInformation("Successfully batch fetched {Count} skill details", result.Count);
        return result;
    }
}
