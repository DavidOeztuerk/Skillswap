using PaymentService.Domain.Entities;

namespace PaymentService.Domain.Repositories;

public interface IPaymentRepository
{
    Task<Payment?> GetByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<Payment?> GetByStripeSessionIdAsync(string sessionId, CancellationToken cancellationToken = default);
    Task<List<Payment>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default);
    Task<Payment> CreateAsync(Payment payment, CancellationToken cancellationToken = default);
    Task UpdateAsync(Payment payment, CancellationToken cancellationToken = default);
}
