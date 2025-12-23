using NotificationService.Domain.Entities;

namespace NotificationService.Domain.Repositories;

public interface INotificationCampaignRepository
{
    Task<NotificationCampaign?> GetByIdAsync(string campaignId, CancellationToken cancellationToken = default);
    Task<List<NotificationCampaign>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<NotificationCampaign> CreateAsync(NotificationCampaign campaign, CancellationToken cancellationToken = default);
    Task<NotificationCampaign> UpdateAsync(NotificationCampaign campaign, CancellationToken cancellationToken = default);
    Task DeleteAsync(string campaignId, CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
