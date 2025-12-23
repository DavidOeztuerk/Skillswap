using Infrastructure.Communication;
using Contracts.Skill.Responses;
using Microsoft.Extensions.Logging;

namespace AppointmentService.Infrastructure.HttpClients;

public interface ISkillServiceClient
{
    Task<GetSkillDetailsResponse?> GetSkillDetailsAsync(string skillId, CancellationToken cancellationToken = default);
    Task<string> GetSkillNameAsync(string skillId, CancellationToken cancellationToken = default);
    Task<bool> ValidateSkillExistsAsync(string skillId, CancellationToken cancellationToken = default);
    Task<List<GetSkillDetailsResponse>> GetSkillsBatchAsync(List<string> skillIds, CancellationToken cancellationToken = default);
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

    public async Task<GetSkillDetailsResponse?> GetSkillDetailsAsync(string skillId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Getting skill details for {SkillId}", skillId);

            var response = await _serviceCommunication.GetAsync<GetSkillDetailsResponse>(
                "skillservice",
                $"api/skills/{skillId}",
                cancellationToken);

            if (response == null)
            {
                _logger.LogWarning("Failed to get skill details for {SkillId} from SkillService", skillId);
                return null;
            }

            _logger.LogDebug("Successfully retrieved skill details for {SkillId}", skillId);
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching skill details for {SkillId} from SkillService", skillId);
            return null;
        }
    }

    public async Task<string> GetSkillNameAsync(string skillId, CancellationToken cancellationToken = default)
    {
        try
        {
            var response = await GetSkillDetailsAsync(skillId, cancellationToken);

            if (response == null)
            {
                _logger.LogWarning("Failed to get skill name for {SkillId} from SkillService", skillId);
                return $"Skill {skillId.Substring(0, 8)}...";
            }

            return response.Name ?? $"Skill {skillId.Substring(0, 8)}...";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching skill name for {SkillId} from SkillService", skillId);
            return $"Skill {skillId.Substring(0, 8)}...";
        }
    }

    public async Task<bool> ValidateSkillExistsAsync(string skillId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Validating skill existence for {SkillId}", skillId);

            var response = await GetSkillDetailsAsync(skillId, cancellationToken);
            var exists = response != null;

            _logger.LogDebug("Skill {SkillId} exists: {Exists}", skillId, exists);
            return exists;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating skill existence for {SkillId}", skillId);
            return false;
        }
    }

    public async Task<List<GetSkillDetailsResponse>> GetSkillsBatchAsync(List<string> skillIds, CancellationToken cancellationToken = default)
    {
        var skills = new List<GetSkillDetailsResponse>();

        try
        {
            _logger.LogDebug("Getting batch skills for {SkillCount} skills", skillIds.Count);

            var tasks = skillIds.Select(async skillId =>
            {
                var skill = await GetSkillDetailsAsync(skillId, cancellationToken);
                return skill;
            });

            var results = await Task.WhenAll(tasks);
            skills.AddRange(results.Where(skill => skill != null)!);

            _logger.LogDebug("Successfully retrieved {FoundCount} out of {RequestedCount} skills",
                skills.Count, skillIds.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching batch skills from SkillService");
        }

        return skills;
    }
}
