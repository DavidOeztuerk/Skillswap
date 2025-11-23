using AppointmentService.Domain.Entities;
using AppointmentService.Domain.Repositories;
using AppointmentService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace AppointmentService.Infrastructure.Repositories;

public class SessionPaymentRepository : ISessionPaymentRepository
{
    private readonly AppointmentDbContext _dbContext;

    public SessionPaymentRepository(AppointmentDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<SessionPayment?> GetByIdAsync(string paymentId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SessionPayments.FirstOrDefaultAsync(p => p.Id == paymentId, cancellationToken);
    }

    public async Task<SessionPayment?> GetByAppointmentIdAsync(string appointmentId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SessionPayments.FirstOrDefaultAsync(p => p.SessionAppointmentId == appointmentId, cancellationToken);
    }

    public async Task<List<SessionPayment>> GetByConnectionAsync(string connectionId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.SessionPayments
            .Where(p => p.SessionAppointment.SessionSeries.ConnectionId == connectionId)
            .ToListAsync(cancellationToken);
    }

    public async Task<SessionPayment> CreateAsync(SessionPayment payment, CancellationToken cancellationToken = default)
    {
        await _dbContext.SessionPayments.AddAsync(payment, cancellationToken);
        return payment;
    }

    public async Task<SessionPayment> UpdateAsync(SessionPayment payment, CancellationToken cancellationToken = default)
    {
        _dbContext.SessionPayments.Update(payment);
        return await Task.FromResult(payment);
    }

    public async Task DeleteAsync(string paymentId, CancellationToken cancellationToken = default)
    {
        var payment = await GetByIdAsync(paymentId, cancellationToken);
        if (payment != null)
        {
            _dbContext.SessionPayments.Remove(payment);
        }
    }

    public async Task DeleteByConnectionAsync(string connectionId, CancellationToken cancellationToken = default)
    {
        var payments = await GetByConnectionAsync(connectionId, cancellationToken);
        _dbContext.SessionPayments.RemoveRange(payments);
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
