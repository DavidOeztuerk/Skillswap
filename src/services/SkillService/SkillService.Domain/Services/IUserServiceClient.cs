namespace SkillService.Domain.Services;

public interface IUserServiceClient
{
    Task<string> GetUserNameAsync(string userId, CancellationToken cancellationToken = default);
    Task<bool> ValidateUserAsync(string userId, CancellationToken cancellationToken = default);
}
