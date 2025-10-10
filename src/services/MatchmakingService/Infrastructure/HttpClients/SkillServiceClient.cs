using Infrastructure.Communication;
using Contracts.Skill.Responses;

namespace MatchmakingService.Infrastructure.HttpClients;

public interface ISkillServiceClient
{
    Task<string> GetSkillNameAsync(string skillId, CancellationToken cancellationToken = default);
    Task<string> GetSkillCategoryAsync(string skillId, CancellationToken cancellationToken = default);
}

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
                $"skills/{skillId}",
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
                $"skills/{skillId}",
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
}
