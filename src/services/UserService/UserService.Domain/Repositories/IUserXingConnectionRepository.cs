using UserService.Domain.Models;

namespace UserService.Domain.Repositories;

/// <summary>
/// Repository interface for managing user Xing connections
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public interface IUserXingConnectionRepository
{
    /// <summary>
    /// Get Xing connection for a user
    /// </summary>
    Task<UserXingConnection?> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get Xing connection by Xing ID
    /// </summary>
    Task<UserXingConnection?> GetByXingIdAsync(string xingId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get a Xing connection by ID
    /// </summary>
    Task<UserXingConnection?> GetByIdAsync(string id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Create a new Xing connection
    /// </summary>
    Task<UserXingConnection> CreateAsync(UserXingConnection connection, CancellationToken cancellationToken = default);

    /// <summary>
    /// Update an existing Xing connection
    /// </summary>
    Task<UserXingConnection> UpdateAsync(UserXingConnection connection, CancellationToken cancellationToken = default);

    /// <summary>
    /// Delete a Xing connection
    /// </summary>
    Task DeleteAsync(UserXingConnection connection, CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if a user has a Xing connection
    /// </summary>
    Task<bool> ExistsAsync(string userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Get all connections with auto-sync enabled
    /// </summary>
    Task<List<UserXingConnection>> GetAutoSyncConnectionsAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Save changes to the database
    /// </summary>
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
