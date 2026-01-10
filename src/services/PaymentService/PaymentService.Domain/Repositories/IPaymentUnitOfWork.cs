namespace PaymentService.Domain.Repositories;

public interface IPaymentUnitOfWork : IAsyncDisposable
{
    IPaymentRepository Payments { get; }
    IPaymentProductRepository PaymentProducts { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task BeginTransactionAsync(CancellationToken cancellationToken = default);
    Task CommitTransactionAsync(CancellationToken cancellationToken = default);
    Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
}
