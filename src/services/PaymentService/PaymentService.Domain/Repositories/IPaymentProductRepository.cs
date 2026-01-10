using PaymentService.Domain.Entities;

namespace PaymentService.Domain.Repositories;

public interface IPaymentProductRepository
{
    Task<PaymentProduct?> GetByIdAsync(string id, CancellationToken cancellationToken = default);
    Task<List<PaymentProduct>> GetActiveByTypeAsync(string? productType, CancellationToken cancellationToken = default);
    Task<List<PaymentProduct>> GetAllActiveAsync(CancellationToken cancellationToken = default);
}
