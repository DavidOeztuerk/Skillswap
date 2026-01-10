using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SkillService.Domain.Configuration;
using SkillService.Domain.Entities;
using SkillService.Domain.Repositories;
using SkillService.Domain.Services;

namespace SkillService.Infrastructure.Services;

/// <summary>
/// Background service that manages listing lifecycle:
/// - Marks listings as expiring when approaching expiration
/// - Marks listings as expired when past expiration date
/// - Hard deletes listings after retention period
/// - Removes expired boosts
/// Phase 10: Listing concept with expiration
/// </summary>
public class ListingExpirationService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ListingExpirationService> _logger;
    private readonly ListingSettings _settings;

    public ListingExpirationService(
        IServiceScopeFactory scopeFactory,
        IOptions<ListingSettings> options,
        ILogger<ListingExpirationService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _settings = options.Value;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_settings.EnableBackgroundService)
        {
            _logger.LogInformation("ListingExpirationService is disabled via configuration");
            return;
        }

        _logger.LogInformation(
            "ListingExpirationService started. Check interval: {Interval} minutes, " +
            "Expiring warning: {Warning} minutes, Hard delete after: {HardDelete} minutes",
            _settings.CheckIntervalMinutes,
            _settings.ExpiringWarningMinutes,
            _settings.HardDeleteAfterMinutes);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessListingsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing listings in background service");
            }

            await Task.Delay(TimeSpan.FromMinutes(_settings.CheckIntervalMinutes), stoppingToken);
        }
    }

    private async Task ProcessListingsAsync(CancellationToken cancellationToken)
    {
        _logger.LogDebug("Starting listing expiration processing...");

        await using var scope = _scopeFactory.CreateAsyncScope();
        var unitOfWork = scope.ServiceProvider.GetRequiredService<ISkillUnitOfWork>();
        var notificationClient = scope.ServiceProvider.GetService<INotificationServiceClient>();

        // Process in order: Expiring notifications → Mark as expired → Remove expired boosts → Hard delete
        await ProcessExpiringNotificationsAsync(unitOfWork, notificationClient, cancellationToken);
        await ProcessExpiredListingsAsync(unitOfWork, notificationClient, cancellationToken);
        await ProcessExpiredBoostsAsync(unitOfWork, cancellationToken);
        await ProcessHardDeletesAsync(unitOfWork, cancellationToken);

        _logger.LogDebug("Listing expiration processing completed");
    }

    /// <summary>
    /// Send notifications for listings approaching expiration
    /// </summary>
    private async Task ProcessExpiringNotificationsAsync(
        ISkillUnitOfWork unitOfWork,
        INotificationServiceClient? notificationClient,
        CancellationToken cancellationToken)
    {
        var expiringListings = await unitOfWork.Listings.GetExpiringListingsAsync(
            _settings.ExpiringWarningMinutes, cancellationToken);

        if (expiringListings.Count == 0)
        {
            _logger.LogDebug("No listings approaching expiration");
            return;
        }

        _logger.LogInformation("Found {Count} listings approaching expiration", expiringListings.Count);

        foreach (var listing in expiringListings)
        {
            try
            {
                // Mark listing as expiring
                listing.MarkAsExpiring();
                listing.MarkExpiringNotificationSent();

                // Send notification if enabled
                if (_settings.EnableNotifications && notificationClient != null)
                {
                    var daysRemaining = Math.Max(1, listing.DaysUntilExpiration);
                    await notificationClient.SendListingExpiringNotificationAsync(
                        listing.UserId,
                        listing.Id,
                        listing.Skill?.Name ?? "Unknown Skill",
                        daysRemaining,
                        cancellationToken);

                    _logger.LogDebug(
                        "Sent expiring notification for listing {ListingId}, {Days} days remaining",
                        listing.Id, daysRemaining);
                }

                await unitOfWork.SaveChangesAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing expiring listing {ListingId}", listing.Id);
            }
        }
    }

    /// <summary>
    /// Mark listings as expired when past expiration date
    /// </summary>
    private async Task ProcessExpiredListingsAsync(
        ISkillUnitOfWork unitOfWork,
        INotificationServiceClient? notificationClient,
        CancellationToken cancellationToken)
    {
        var expiredListings = await unitOfWork.Listings.GetExpiredListingsAsync(cancellationToken);

        if (expiredListings.Count == 0)
        {
            _logger.LogDebug("No expired listings to process");
            return;
        }

        _logger.LogInformation("Found {Count} expired listings", expiredListings.Count);

        var listingIds = expiredListings.Select(l => l.Id).ToList();
        var expiredCount = await unitOfWork.Listings.BulkExpireListingsAsync(listingIds, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Marked {Count} listings as expired", expiredCount);

        // Send notifications for expired listings
        if (_settings.EnableNotifications && notificationClient != null)
        {
            foreach (var listing in expiredListings)
            {
                try
                {
                    // Load skill for notification
                    var listingWithSkill = await unitOfWork.Listings.GetByIdWithSkillAsync(
                        listing.Id, cancellationToken);

                    if (listingWithSkill != null)
                    {
                        await notificationClient.SendListingExpiredNotificationAsync(
                            listingWithSkill.UserId,
                            listingWithSkill.Id,
                            listingWithSkill.Skill?.Name ?? "Unknown Skill",
                            cancellationToken);

                        _logger.LogDebug("Sent expired notification for listing {ListingId}", listing.Id);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error sending expired notification for listing {ListingId}", listing.Id);
                }
            }
        }
    }

    /// <summary>
    /// Remove expired boosts from listings
    /// </summary>
    private async Task ProcessExpiredBoostsAsync(
        ISkillUnitOfWork unitOfWork,
        CancellationToken cancellationToken)
    {
        var expiredBoosts = await unitOfWork.Listings.GetExpiredBoostsAsync(cancellationToken);

        if (expiredBoosts.Count == 0)
        {
            _logger.LogDebug("No expired boosts to process");
            return;
        }

        var listingIds = expiredBoosts.Select(l => l.Id).ToList();
        var removedCount = await unitOfWork.Listings.BulkRemoveExpiredBoostsAsync(listingIds, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Removed {Count} expired boosts", removedCount);
    }

    /// <summary>
    /// Hard delete listings that have been expired for longer than retention period
    /// </summary>
    private async Task ProcessHardDeletesAsync(
        ISkillUnitOfWork unitOfWork,
        CancellationToken cancellationToken)
    {
        var listingsToDelete = await unitOfWork.Listings.GetListingsForHardDeleteAsync(
            _settings.HardDeleteAfterMinutes, cancellationToken);

        if (listingsToDelete.Count == 0)
        {
            _logger.LogDebug("No listings to hard delete");
            return;
        }

        _logger.LogInformation("Found {Count} listings for hard delete", listingsToDelete.Count);

        var listingIds = listingsToDelete.Select(l => l.Id).ToList();
        var deletedCount = await unitOfWork.Listings.BulkHardDeleteListingsAsync(listingIds, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Hard deleted {Count} listings", deletedCount);
    }
}
