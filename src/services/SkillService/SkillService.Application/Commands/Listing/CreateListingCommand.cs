using Contracts.Listing.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace SkillService.Application.Commands.Listing;

/// <summary>
/// Command to create a new listing for a skill
/// </summary>
public record CreateListingCommand(
    string SkillId,
    string Type)
    : ICommand<ListingResponse>, IAuditableCommand, ICacheInvalidatingCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // ICacheInvalidatingCommand implementation
    public string[] InvalidationPatterns =>
    [
        "listings:featured:*",
        "listings:search:*",
        "listings:my-listings:*"
    ];
}

public class CreateListingCommandValidator : AbstractValidator<CreateListingCommand>
{
    public CreateListingCommandValidator()
    {
        RuleFor(x => x.SkillId)
            .NotEmpty().WithMessage("Skill ID is required");

        RuleFor(x => x.Type)
            .NotEmpty().WithMessage("Listing type is required")
            .Must(t => t == "Offer" || t == "Request")
            .WithMessage("Type must be 'Offer' or 'Request'");
    }
}
