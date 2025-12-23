using AppointmentService.Domain.Entities;

namespace AppointmentService.Domain.Repositories;

/// <summary>
/// Repository interface for Connection entities.
/// Manages the top-level connection between two users for skill exchange/payment.
/// </summary>
public interface IConnectionRepository
{
    // Query operations
    Task<Connection?> GetByIdAsync(string connectionId, CancellationToken cancellationToken = default);
    Task<Connection?> GetWithSeriesAsync(string connectionId, CancellationToken cancellationToken = default);
    Task<List<Connection>> GetByUserAsync(string userId, CancellationToken cancellationToken = default);
    Task<Connection?> GetByMatchRequestIdAsync(string matchRequestId, CancellationToken cancellationToken = default);

    // Create operations
    Task<Connection> CreateAsync(Connection connection, CancellationToken cancellationToken = default);

    // Update operations
    Task<Connection> UpdateAsync(Connection connection, CancellationToken cancellationToken = default);

    // Delete operations
    Task DeleteAsync(string connectionId, CancellationToken cancellationToken = default);
    Task DeleteByUserAsync(string userId, CancellationToken cancellationToken = default);

    // Save changes
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
