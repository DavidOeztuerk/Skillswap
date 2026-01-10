using Microsoft.EntityFrameworkCore.Storage;
using PaymentService.Domain.Repositories;
using PaymentService.Infrastructure.Data;

namespace PaymentService.Infrastructure.Repositories;

public class PaymentUnitOfWork(PaymentDbContext dbContext) : IPaymentUnitOfWork
{
    private readonly PaymentDbContext _dbContext = dbContext;
    private IDbContextTransaction? _transaction;

    private IPaymentRepository? _payments;
    private IPaymentProductRepository? _paymentProducts;

    public IPaymentRepository Payments => _payments ??= new PaymentRepository(_dbContext);
    public IPaymentProductRepository PaymentProducts => _paymentProducts ??= new PaymentProductRepository(_dbContext);

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        _transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);
    }

    public async Task CommitTransactionAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
            if (_transaction != null)
            {
                await _transaction.CommitAsync(cancellationToken);
            }
        }
        catch
        {
            if (_transaction != null)
            {
                await _transaction.RollbackAsync(cancellationToken);
            }
            throw;
        }
        finally
        {
            if (_transaction != null)
            {
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }
    }

    public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction != null)
        {
            await _transaction.RollbackAsync(cancellationToken);
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public async ValueTask DisposeAsync()
    {
        if (_transaction != null)
        {
            await _transaction.DisposeAsync();
            _transaction = null;
        }
        await _dbContext.DisposeAsync();
        GC.SuppressFinalize(this);
    }
}
