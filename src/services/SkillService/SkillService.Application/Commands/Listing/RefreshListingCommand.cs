using Contracts.Listing.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace SkillService.Application.Commands.Listing;

/// <summary>
/// Command to refresh a listing (extend expiration)
/// </summary>
public record RefreshListingCommand(string ListingId)
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

public class RefreshListingCommandValidator : AbstractValidator<RefreshListingCommand>
{
  public RefreshListingCommandValidator()
  {
    RuleFor(x => x.ListingId)
        .NotEmpty().WithMessage("Listing ID is required");
  }
}
