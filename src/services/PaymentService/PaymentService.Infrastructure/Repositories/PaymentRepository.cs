using Microsoft.EntityFrameworkCore;
using PaymentService.Domain.Entities;
using PaymentService.Domain.Repositories;
using PaymentService.Infrastructure.Data;

namespace PaymentService.Infrastructure.Repositories;

public class PaymentRepository(PaymentDbContext dbContext) : IPaymentRepository
{
    private readonly PaymentDbContext _dbContext = dbContext;

    public async Task<Payment?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Payments
            .Include(p => p.Product)
            .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted, cancellationToken);
    }

    public async Task<Payment?> GetByStripeSessionIdAsync(string sessionId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Payments
            .Include(p => p.Product)
            .FirstOrDefaultAsync(p => p.StripeSessionId == sessionId && !p.IsDeleted, cancellationToken);
    }

    public async Task<List<Payment>> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.Payments
            .Include(p => p.Product)
            .Where(p => p.UserId == userId && !p.IsDeleted)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<Payment> CreateAsync(Payment payment, CancellationToken cancellationToken = default)
    {
        await _dbContext.Payments.AddAsync(payment, cancellationToken);
        return payment;
    }

    public Task UpdateAsync(Payment payment, CancellationToken cancellationToken = default)
    {
        _dbContext.Payments.Update(payment);
        return Task.CompletedTask;
    }
}
