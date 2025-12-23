using Microsoft.EntityFrameworkCore;
using NotificationService.Domain.Entities;
using NotificationService.Domain.Repositories;
using NotificationService.Infrastructure.Data;

namespace NotificationService.Infrastructure.Repositories;

public class ReminderSettingsRepository : IReminderSettingsRepository
{
    private readonly NotificationDbContext _dbContext;

    public ReminderSettingsRepository(NotificationDbContext dbContext)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public async Task<ReminderSettings?> GetByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        return await _dbContext.ReminderSettings
            .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);
    }

    public async Task<ReminderSettings> CreateAsync(ReminderSettings settings, CancellationToken cancellationToken = default)
    {
        await _dbContext.ReminderSettings.AddAsync(settings, cancellationToken);
        return settings;
    }

    public async Task<ReminderSettings> UpdateAsync(ReminderSettings settings, CancellationToken cancellationToken = default)
    {
        _dbContext.ReminderSettings.Update(settings);
        return await Task.FromResult(settings);
    }

    public async Task DeleteByUserIdAsync(string userId, CancellationToken cancellationToken = default)
    {
        var settings = await GetByUserIdAsync(userId, cancellationToken);
        if (settings != null)
        {
            _dbContext.ReminderSettings.Remove(settings);
        }
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
