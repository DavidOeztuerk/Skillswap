using Contracts.Skill.Responses;

namespace UserService.Application.Services;

/// <summary>
/// Interface for communicating with the SkillService
/// </summary>
public interface ISkillServiceClient
{
    Task<GetSkillDetailsResponse?> GetSkillDetailsAsync(string skillId, CancellationToken cancellationToken = default);
    Task<bool> ValidateSkillExistsAsync(string skillId, CancellationToken cancellationToken = default);
    Task<List<GetSkillDetailsResponse>> ValidateSkillsBatchAsync(List<string> skillIds, CancellationToken cancellationToken = default);
    Task<List<UserSkillResponse>?> GetUserSkillsAsync(string userId, CancellationToken cancellationToken = default);
    Task<bool> DeleteUserSkillsAsync(string userId, CancellationToken cancellationToken = default);
    Task<UserSkillCountsResponse?> GetUserSkillCountsAsync(string userId, CancellationToken cancellationToken = default);
}
