using Contracts.Events;
using Infrastructure.Caching;
using Infrastructure.Caching.Http;
using MassTransit;
using Microsoft.Extensions.Logging;
using SkillService.Domain.Repositories;

namespace SkillService.Infrastructure.Consumers;

/// <summary>
/// Consumer for PaymentSucceededIntegrationEvent
/// Activates listing boosts when payment is successful
/// </summary>
public class PaymentSucceededConsumer : IConsumer<PaymentSucceededIntegrationEvent>
{
    private readonly ISkillUnitOfWork _unitOfWork;
    private readonly IDistributedCacheService? _cacheService;
    private readonly IETagGenerator? _etagGenerator;
    private readonly ILogger<PaymentSucceededConsumer> _logger;

    // Cache invalidation patterns for boost activation
    private static readonly string[] ListingCachePatterns =
    [
        "listings:featured:*",
        "listings:search:*",
        "listings:my-listings:*"
    ];

    private static readonly string[] ListingETagPatterns =
    [
        "/api/skills*",
        "/skills*",
        "/api/listings*",
        "/listings*"
    ];

    public PaymentSucceededConsumer(
        ISkillUnitOfWork unitOfWork,
        ILogger<PaymentSucceededConsumer> logger,
        IDistributedCacheService? cacheService = null,
        IETagGenerator? etagGenerator = null)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
        _cacheService = cacheService;
        _etagGenerator = etagGenerator;
    }

    public async Task Consume(ConsumeContext<PaymentSucceededIntegrationEvent> context)
    {
        var message = context.Message;

        _logger.LogInformation(
            "Received PaymentSucceededIntegrationEvent for Payment: {PaymentId}, ReferenceType: {ReferenceType}",
            message.PaymentId, message.ReferenceType);

        // Only process ListingBoost payments
        if (message.ReferenceType != "ListingBoost")
        {
            _logger.LogDebug(
                "Ignoring payment for non-boost reference type: {ReferenceType}",
                message.ReferenceType);
            return;
        }

        if (string.IsNullOrEmpty(message.ReferenceId))
        {
            _logger.LogWarning(
                "ListingBoost payment {PaymentId} has no ReferenceId (ListingId)",
                message.PaymentId);
            return;
        }

        try
        {
            // Get the listing by ID
            var listing = await _unitOfWork.Listings.GetByIdAsync(
                message.ReferenceId, context.CancellationToken);

            if (listing == null)
            {
                _logger.LogWarning(
                    "Listing {ListingId} not found for boost activation (Payment: {PaymentId})",
                    message.ReferenceId, message.PaymentId);
                return;
            }

            // Verify the listing belongs to the user who paid
            if (listing.UserId != message.UserId)
            {
                _logger.LogWarning(
                    "User {UserId} attempted to boost listing {ListingId} owned by {OwnerId}",
                    message.UserId, listing.Id, listing.UserId);
                return;
            }

            // Convert days to minutes for the Boost method
            int durationMinutes = message.DurationDays * 24 * 60;

            // Activate the boost
            listing.Boost(durationMinutes, message.BoostType);

            // Save changes
            await _unitOfWork.Listings.UpdateAsync(listing, context.CancellationToken);
            await _unitOfWork.SaveChangesAsync(context.CancellationToken);

            _logger.LogInformation(
                "Boost activated for listing {ListingId}: Type={BoostType}, Duration={Days} days, Until={BoostedUntil}",
                listing.Id, message.BoostType, message.DurationDays, listing.BoostedUntil);

            // Invalidate cache so the boost is visible immediately
            await InvalidateCacheAsync(listing.Id, listing.UserId, context.CancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Error activating boost for listing {ListingId} (Payment: {PaymentId})",
                message.ReferenceId, message.PaymentId);
            throw; // Re-throw to trigger retry policy
        }
    }

    /// <summary>
    /// Invalidate listing-related caches after boost activation
    /// </summary>
    private async Task InvalidateCacheAsync(string listingId, string userId, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Invalidating cache after boost activation for listing {ListingId}", listingId);

        try
        {
            // Invalidate CQRS cache patterns
            if (_cacheService != null)
            {
                var cacheTasks = new List<Task>();

                foreach (var pattern in ListingCachePatterns)
                {
                    cacheTasks.Add(_cacheService.RemoveByPatternAsync(pattern, cancellationToken));
                }

                // Also invalidate specific listing cache
                cacheTasks.Add(_cacheService.RemoveAsync($"listings:{listingId}", cancellationToken));

                await Task.WhenAll(cacheTasks);
                _logger.LogDebug("Invalidated {Count} cache patterns for boost", ListingCachePatterns.Length + 1);
            }

            // Invalidate ETags to prevent 304 Not Modified with stale data
            if (_etagGenerator != null)
            {
                var etagTasks = ListingETagPatterns
                    .Select(pattern => _etagGenerator.InvalidateETagsByPatternAsync(pattern, cancellationToken));
                await Task.WhenAll(etagTasks);
                _logger.LogDebug("Invalidated {Count} ETag patterns for boost", ListingETagPatterns.Length);
            }

            _logger.LogInformation("Cache invalidation completed for boost activation");
        }
        catch (Exception ex)
        {
            // Log but don't fail - cache invalidation is not critical
            _logger.LogWarning(ex, "Cache invalidation failed for boost, stale data may be served temporarily");
        }
    }
}
