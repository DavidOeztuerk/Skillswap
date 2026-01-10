namespace SkillService.Domain.Services;

public interface INotificationServiceClient
{
    Task SendNotificationAsync(string userId, string message, CancellationToken cancellationToken = default);

    // Phase 10: Listing notification methods
    Task<bool> SendListingExpiringNotificationAsync(
        string userId,
        string listingId,
        string skillName,
        int daysRemaining,
        CancellationToken cancellationToken = default);

    Task<bool> SendListingExpiredNotificationAsync(
        string userId,
        string listingId,
        string skillName,
        CancellationToken cancellationToken = default);
}
