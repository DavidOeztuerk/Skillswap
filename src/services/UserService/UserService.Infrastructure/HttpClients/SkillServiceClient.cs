using Infrastructure.Communication;
using Contracts.Skill.Responses;
using Contracts.Skill.Requests;
using Microsoft.Extensions.Logging;

namespace UserService.Infrastructure.HttpClients;

public interface ISkillServiceClient
{
    Task<GetSkillDetailsResponse?> GetSkillDetailsAsync(string skillId, CancellationToken cancellationToken = default);
    Task<bool> ValidateSkillExistsAsync(string skillId, CancellationToken cancellationToken = default);
    Task<List<GetSkillDetailsResponse>> ValidateSkillsBatchAsync(List<string> skillIds, CancellationToken cancellationToken = default);
    Task<List<UserSkillResponse>?> GetUserSkillsAsync(string userId, CancellationToken cancellationToken = default);
    Task<bool> DeleteUserSkillsAsync(string userId, CancellationToken cancellationToken = default);
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

            var response = await _serviceCommunication.SendRequestAsync<object, GetSkillDetailsResponse>(
                "skillservice",
                $"api/skills/{skillId}",
                new { },
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

    public async Task<List<GetSkillDetailsResponse>> ValidateSkillsBatchAsync(List<string> skillIds, CancellationToken cancellationToken = default)
    {
        var validSkills = new List<GetSkillDetailsResponse>();

        try
        {
            _logger.LogDebug("Validating {SkillCount} skills in batch", skillIds.Count);

            var tasks = skillIds.Select(async skillId =>
            {
                var skill = await GetSkillDetailsAsync(skillId, cancellationToken);
                return skill;
            });

            var results = await Task.WhenAll(tasks);
            validSkills.AddRange(results.Where(skill => skill != null)!);

            _logger.LogDebug("Found {ValidCount} valid skills out of {RequestedCount}",
                validSkills.Count, skillIds.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating skills batch from SkillService");
        }

        return validSkills;
    }

    public async Task<List<UserSkillResponse>?> GetUserSkillsAsync(string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Getting skills for user {UserId}", userId);

            var request = new GetUserSkillsRequest(
                PageNumber: 1,
                PageSize: 100, // Get all user skills
                IncludeInactive: false
            );

            var response = await _serviceCommunication.SendRequestAsync<GetUserSkillsRequest, List<UserSkillResponse>>(
                "skillservice",
                "api/skills/my-skills",
                request,
                cancellationToken,
                new Dictionary<string, string> { ["userId"] = userId });

            if (response == null)
            {
                _logger.LogWarning("Failed to get skills for user {UserId} from SkillService", userId);
                return null;
            }

            _logger.LogDebug("Successfully retrieved {SkillCount} skills for user {UserId}",
                response.Count, userId);
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching skills for user {UserId} from SkillService", userId);
            return null;
        }
    }

    public async Task<bool> DeleteUserSkillsAsync(string userId, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogDebug("Deleting all skills for user {UserId}", userId);

            // First get user skills to delete them individually
            var userSkills = await GetUserSkillsAsync(userId, cancellationToken);
            if (userSkills == null || !userSkills.Any())
            {
                _logger.LogDebug("No skills found for user {UserId} to delete", userId);
                return true;
            }

            var deleteTasks = userSkills.Select(async skill =>
            {
                try
                {
                    await _serviceCommunication.SendRequestAsync<object, object>(
                        "skillservice",
                        $"api/skills/{skill.SkillId}",
                        new { },
                        cancellationToken);
                    return true;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to delete skill {SkillId} for user {UserId}", skill.SkillId, userId);
                    return false;
                }
            });

            var results = await Task.WhenAll(deleteTasks);
            var deletedCount = results.Count(r => r);

            _logger.LogDebug("Deleted {DeletedCount} out of {TotalCount} skills for user {UserId}",
                deletedCount, userSkills.Count, userId);

            return deletedCount == userSkills.Count;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting skills for user {UserId} from SkillService", userId);
            return false;
        }
    }
}