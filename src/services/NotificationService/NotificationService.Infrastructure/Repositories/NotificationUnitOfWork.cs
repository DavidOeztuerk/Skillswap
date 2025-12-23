using Microsoft.EntityFrameworkCore.Storage;
using NotificationService.Domain.Repositories;
using NotificationService.Infrastructure.Data;

namespace NotificationService.Infrastructure.Repositories;

public class NotificationUnitOfWork : INotificationUnitOfWork
{
    private readonly NotificationDbContext _dbContext;
    private IDbContextTransaction? _transaction;

    private INotificationRepository? _notifications;
    private IEmailTemplateRepository? _emailTemplates;
    private INotificationPreferencesRepository? _notificationPreferences;
    private INotificationEventRepository? _notificationEvents;
    private INotificationCampaignRepository? _notificationCampaigns;
    private INotificationDigestEntryRepository? _notificationDigestEntries;
    private IReminderSettingsRepository? _reminderSettings;
    private IScheduledReminderRepository? _scheduledReminders;

    // Chat repositories
    private IChatThreadRepository? _chatThreads;
    private IChatMessageRepository? _chatMessages;
    private IChatAttachmentRepository? _chatAttachments;

    public NotificationUnitOfWork(NotificationDbContext dbContext)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    public INotificationRepository Notifications =>
        _notifications ??= new NotificationRepository(_dbContext);

    public IEmailTemplateRepository EmailTemplates =>
        _emailTemplates ??= new EmailTemplateRepository(_dbContext);

    public INotificationPreferencesRepository NotificationPreferences =>
        _notificationPreferences ??= new NotificationPreferencesRepository(_dbContext);

    public INotificationEventRepository NotificationEvents =>
        _notificationEvents ??= new NotificationEventRepository(_dbContext);

    public INotificationCampaignRepository NotificationCampaigns =>
        _notificationCampaigns ??= new NotificationCampaignRepository(_dbContext);

    public INotificationDigestEntryRepository NotificationDigestEntries =>
        _notificationDigestEntries ??= new NotificationDigestEntryRepository(_dbContext);

    public IReminderSettingsRepository ReminderSettings =>
        _reminderSettings ??= new ReminderSettingsRepository(_dbContext);

    public IScheduledReminderRepository ScheduledReminders =>
        _scheduledReminders ??= new ScheduledReminderRepository(_dbContext);

    // Chat repository properties
    public IChatThreadRepository ChatThreads =>
        _chatThreads ??= new ChatThreadRepository(_dbContext);

    public IChatMessageRepository ChatMessages =>
        _chatMessages ??= new ChatMessageRepository(_dbContext);

    public IChatAttachmentRepository ChatAttachments =>
        _chatAttachments ??= new ChatAttachmentRepository(_dbContext);

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
        try
        {
            if (_transaction != null)
            {
                await _transaction.RollbackAsync(cancellationToken);
            }
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
