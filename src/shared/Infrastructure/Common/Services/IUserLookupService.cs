using Infrastructure.Models;

namespace Infrastructure.Services;

public interface IUserLookupService
{
    Task<UserSummary?> GetUserAsync(string userId, CancellationToken cancellationToken = default);
}
