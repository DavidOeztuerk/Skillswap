using UserService.Domain.Models;

namespace UserService.Domain.Repositories;

/// <summary>
/// Repository interface for managing user LinkedIn connections
/// </summary>
public interface IUserLinkedInConnectionRepository
{
  /// <summary>
  /// Get LinkedIn connection for a user
  /// </summary>
  Task<UserLinkedInConnection?> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default);

  /// <summary>
  /// Get LinkedIn connection by LinkedIn ID
  /// </summary>
  Task<UserLinkedInConnection?> GetByLinkedInIdAsync(string linkedInId, CancellationToken cancellationToken = default);

  /// <summary>
  /// Get a LinkedIn connection by ID
  /// </summary>
  Task<UserLinkedInConnection?> GetByIdAsync(string id, CancellationToken cancellationToken = default);

  /// <summary>
  /// Create a new LinkedIn connection
  /// </summary>
  Task<UserLinkedInConnection> CreateAsync(UserLinkedInConnection connection, CancellationToken cancellationToken = default);

  /// <summary>
  /// Update an existing LinkedIn connection
  /// </summary>
  Task<UserLinkedInConnection> UpdateAsync(UserLinkedInConnection connection, CancellationToken cancellationToken = default);

  /// <summary>
  /// Delete a LinkedIn connection
  /// </summary>
  Task DeleteAsync(UserLinkedInConnection connection, CancellationToken cancellationToken = default);

  /// <summary>
  /// Check if a user has a LinkedIn connection
  /// </summary>
  Task<bool> ExistsAsync(string userId, CancellationToken cancellationToken = default);

  /// <summary>
  /// Get all connections that need token refresh (expiring soon)
  /// </summary>
  Task<List<UserLinkedInConnection>> GetConnectionsNeedingRefreshAsync(CancellationToken cancellationToken = default);

  /// <summary>
  /// Get all connections with auto-sync enabled
  /// </summary>
  Task<List<UserLinkedInConnection>> GetAutoSyncConnectionsAsync(CancellationToken cancellationToken = default);

  /// <summary>
  /// Save changes to the database
  /// </summary>
  Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
