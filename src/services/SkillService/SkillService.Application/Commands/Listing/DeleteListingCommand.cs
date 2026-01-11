using CQRS.Interfaces;
using FluentValidation;

namespace SkillService.Application.Commands.Listing;

/// <summary>
/// Command to delete a listing
/// </summary>
public record DeleteListingCommand(string ListingId)
    : ICommand<bool>, IAuditableCommand, ICacheInvalidatingCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // ICacheInvalidatingCommand implementation
    public string[] InvalidationPatterns =>
    [
        "listings:featured:*",
        "listings:search:*",
        "listings:my-listings:*",
        $"listings:{ListingId}"
    ];
}

public class DeleteListingCommandValidator : AbstractValidator<DeleteListingCommand>
{
    public DeleteListingCommandValidator()
    {
        RuleFor(x => x.ListingId)
            .NotEmpty().WithMessage("Listing ID is required");
    }
}
