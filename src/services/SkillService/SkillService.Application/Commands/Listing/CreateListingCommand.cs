using Contracts.Listing.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace SkillService.Application.Commands.Listing;

/// <summary>
/// Command to create a new listing for a skill
/// Phase 10: Listing concept with expiration
/// </summary>
public record CreateListingCommand(
    string SkillId,
    string Type)
    : ICommand<ListingResponse>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
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
