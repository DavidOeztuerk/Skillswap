using Contracts.Events;
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
    private readonly ILogger<PaymentSucceededConsumer> _logger;

    public PaymentSucceededConsumer(
        ISkillUnitOfWork unitOfWork,
        ILogger<PaymentSucceededConsumer> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
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
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Error activating boost for listing {ListingId} (Payment: {PaymentId})",
                message.ReferenceId, message.PaymentId);
            throw; // Re-throw to trigger retry policy
        }
    }
}
