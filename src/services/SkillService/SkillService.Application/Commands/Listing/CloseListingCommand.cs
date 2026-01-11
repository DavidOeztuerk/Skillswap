using Contracts.Listing.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace SkillService.Application.Commands.Listing;

/// <summary>
/// Command to close a listing manually
/// </summary>
public record CloseListingCommand(
    string ListingId,
    string? Reason = null)
    : ICommand<ListingResponse>, IAuditableCommand, ICacheInvalidatingCommand
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

public class CloseListingCommandValidator : AbstractValidator<CloseListingCommand>
{
  public CloseListingCommandValidator()
  {
    RuleFor(x => x.ListingId)
        .NotEmpty().WithMessage("Listing ID is required");

    RuleFor(x => x.Reason)
        .MaximumLength(500)
        .When(x => !string.IsNullOrEmpty(x.Reason))
        .WithMessage("Reason cannot exceed 500 characters");
  }
}
