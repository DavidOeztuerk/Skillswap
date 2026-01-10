using Microsoft.EntityFrameworkCore;
using PaymentService.Domain.Entities;
using PaymentService.Domain.Repositories;
using PaymentService.Infrastructure.Data;

namespace PaymentService.Infrastructure.Repositories;

public class PaymentProductRepository(PaymentDbContext dbContext) : IPaymentProductRepository
{
    private readonly PaymentDbContext _dbContext = dbContext;

    public async Task<PaymentProduct?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.PaymentProducts
            .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted, cancellationToken);
    }

    public async Task<List<PaymentProduct>> GetActiveByTypeAsync(string? productType, CancellationToken cancellationToken = default)
    {
        return await _dbContext.PaymentProducts
            .Where(p => p.IsActive && !p.IsDeleted && p.ProductType == productType)
            .OrderBy(p => p.SortOrder)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<PaymentProduct>> GetAllActiveAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.PaymentProducts
            .Where(p => p.IsActive && !p.IsDeleted)
            .OrderBy(p => p.SortOrder)
            .ToListAsync(cancellationToken);
    }
}
