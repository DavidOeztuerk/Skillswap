using Contracts.Listing.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace SkillService.Application.Commands.Listing;

/// <summary>
/// Command to refresh a listing (extend expiration)
/// Phase 10: Listing concept with expiration
/// </summary>
public record RefreshListingCommand(string ListingId)
    : ICommand<ListingResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class RefreshListingCommandValidator : AbstractValidator<RefreshListingCommand>
{
    public RefreshListingCommandValidator()
    {
        RuleFor(x => x.ListingId)
            .NotEmpty().WithMessage("Listing ID is required");
    }
}
