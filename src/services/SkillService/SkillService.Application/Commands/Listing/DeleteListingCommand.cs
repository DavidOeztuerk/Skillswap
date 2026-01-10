using CQRS.Interfaces;
using FluentValidation;

namespace SkillService.Application.Commands.Listing;

/// <summary>
/// Command to delete a listing
/// Phase 10: Listing concept with expiration
/// </summary>
public record DeleteListingCommand(string ListingId)
    : ICommand<bool>, IAuditableCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class DeleteListingCommandValidator : AbstractValidator<DeleteListingCommand>
{
    public DeleteListingCommandValidator()
    {
        RuleFor(x => x.ListingId)
            .NotEmpty().WithMessage("Listing ID is required");
    }
}
