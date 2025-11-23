using Microsoft.EntityFrameworkCore;
using NotificationService.Domain.Entities;
using NotificationService.Domain.Repositories;
using NotificationService.Infrastructure.Data;

namespace NotificationService.Infrastructure.Repositories;

public class NotificationCampaignRepository : INotificationCampaignRepository
{
    private readonly NotificationDbContext _dbContext;

    public NotificationCampaignRepository(NotificationDbContext dbContext)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<NotificationCampaign?> GetByIdAsync(string id, CancellationToken cancellationToken = default)
    {
        return await _dbContext.NotificationCampaigns
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
    }

    public async Task<List<NotificationCampaign>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.NotificationCampaigns
            .Where(c => !c.IsDeleted)
            .ToListAsync(cancellationToken);
    }

    public async Task<NotificationCampaign> CreateAsync(NotificationCampaign entity, CancellationToken cancellationToken = default)
    {
        await _dbContext.NotificationCampaigns.AddAsync(entity, cancellationToken);
        return entity;
    }

    public async Task<NotificationCampaign> UpdateAsync(NotificationCampaign entity, CancellationToken cancellationToken = default)
    {
        _dbContext.NotificationCampaigns.Update(entity);
        return await Task.FromResult(entity);
    }

    public async Task DeleteAsync(string id, CancellationToken cancellationToken = default)
    {
        var entity = await GetByIdAsync(id, cancellationToken);
        if (entity != null)
        {
            _dbContext.NotificationCampaigns.Remove(entity);
        }
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
