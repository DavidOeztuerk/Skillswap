using AppointmentService.Domain.Entities;

namespace AppointmentService.Domain.Repositories;

/// <summary>
/// Repository interface for SessionPayment entities.
/// Manages session payment tracking.
/// </summary>
public interface ISessionPaymentRepository
{
    // Query operations
    Task<SessionPayment?> GetByIdAsync(string paymentId, CancellationToken cancellationToken = default);
    Task<SessionPayment?> GetByAppointmentIdAsync(string appointmentId, CancellationToken cancellationToken = default);
    Task<List<SessionPayment>> GetByConnectionAsync(string connectionId, CancellationToken cancellationToken = default);

    // Create operations
    Task<SessionPayment> CreateAsync(SessionPayment payment, CancellationToken cancellationToken = default);

    // Update operations
    Task<SessionPayment> UpdateAsync(SessionPayment payment, CancellationToken cancellationToken = default);

    // Delete operations
    Task DeleteAsync(string paymentId, CancellationToken cancellationToken = default);
    Task DeleteByConnectionAsync(string connectionId, CancellationToken cancellationToken = default);

    // Save changes
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
