using Contracts.Listing.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace SkillService.Application.Commands.Listing;

/// <summary>
/// Command to boost a listing for higher visibility
/// Phase 10: Listing concept with expiration
/// </summary>
public record BoostListingCommand(
    string ListingId,
    int? DurationDays = null)
    : ICommand<ListingResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
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
