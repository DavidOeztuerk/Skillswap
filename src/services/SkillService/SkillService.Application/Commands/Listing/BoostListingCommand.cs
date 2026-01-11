using Contracts.Listing.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace SkillService.Application.Commands.Listing;

/// <summary>
/// Command to boost a listing for higher visibility
/// </summary>
public record BoostListingCommand(
    string ListingId,
    int? DurationDays = null)
    : ICommand<ListingResponse>, IAuditableCommand, ICacheInvalidatingCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // ICacheInvalidatingCommand implementation
    // Invalidate featured listings cache when a listing is boosted
    public string[] InvalidationPatterns =>
    [
        "listings:featured:*",  // Featured listings for homepage
        "listings:search:*",    // Search results may change due to boost
        "listings:my-listings:*", // User's listings may change
        $"listings:{ListingId}" // This specific listing
    ];
}

public class BoostListingCommandValidator : AbstractValidator<BoostListingCommand>
{
    public BoostListingCommandValidator()
    {
        RuleFor(x => x.ListingId)
            .NotEmpty().WithMessage("Listing ID is required");

        RuleFor(x => x.DurationDays)
            .InclusiveBetween(1, 30)
            .When(x => x.DurationDays.HasValue)
            .WithMessage("Boost duration must be between 1 and 30 days");
    }
}
