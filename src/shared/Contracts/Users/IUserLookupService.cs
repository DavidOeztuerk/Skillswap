namespace Contracts.Users;

public interface IUserLookupService
{
    Task<UserSummary?> GetUserAsync(string userId, CancellationToken cancellationToken = default);
}
