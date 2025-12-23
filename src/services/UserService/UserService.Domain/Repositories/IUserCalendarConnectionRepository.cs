using UserService.Domain.Models;

namespace UserService.Domain.Repositories;

/// <summary>
/// Repository interface for managing user calendar connections
/// </summary>
public interface IUserCalendarConnectionRepository
{
    /// <summary>
    /// Get all calendar connections for a user
    /// </summary>
    Task<List<UserCalendarConnection>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get a specific calendar connection by user ID and provider
    /// </summary>
    Task<UserCalendarConnection?> GetByUserAndProviderAsync(string userId, string provider, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get a calendar connection by ID
    /// </summary>
    Task<UserCalendarConnection?> GetByIdAsync(string id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Create a new calendar connection
    /// </summary>
    Task<UserCalendarConnection> CreateAsync(UserCalendarConnection connection, CancellationToken cancellationToken = default);

    /// <summary>
    /// Update an existing calendar connection
    /// </summary>
    Task<UserCalendarConnection> UpdateAsync(UserCalendarConnection connection, CancellationToken cancellationToken = default);

    /// <summary>
    /// Delete a calendar connection
    /// </summary>
    Task DeleteAsync(UserCalendarConnection connection, CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if a user has a connection to a specific provider
    /// </summary>
    Task<bool> ExistsAsync(string userId, string provider, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get all connections that need token refresh (expiring soon)
    /// </summary>
    Task<List<UserCalendarConnection>> GetConnectionsNeedingRefreshAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Save changes to the database
    /// </summary>
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
