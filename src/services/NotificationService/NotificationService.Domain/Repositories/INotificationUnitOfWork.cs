namespace NotificationService.Domain.Repositories;

public interface INotificationUnitOfWork : IAsyncDisposable
{
    INotificationRepository Notifications { get; }
    IEmailTemplateRepository EmailTemplates { get; }
    INotificationPreferencesRepository NotificationPreferences { get; }
    INotificationEventRepository NotificationEvents { get; }
    INotificationCampaignRepository NotificationCampaigns { get; }
    INotificationDigestEntryRepository NotificationDigestEntries { get; }
    
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task BeginTransactionAsync(CancellationToken cancellationToken = default);
    Task CommitTransactionAsync(CancellationToken cancellationToken = default);
    Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
}
