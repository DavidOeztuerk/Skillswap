using System.ComponentModel.DataAnnotations;
using Contracts.Common;

namespace Contracts.Listing.Requests;

/// <summary>
/// API request for creating a new listing
/// Phase 10: Listing concept with expiration
/// </summary>
public record CreateListingRequest(
    [Required(ErrorMessage = "Skill ID is required")]
    string SkillId,

    [Required(ErrorMessage = "Listing type is required")]
    [RegularExpression("^(Offer|Request)$", ErrorMessage = "Type must be 'Offer' or 'Request'")]
    string Type)
    : IVersionedContract
{
    public string ApiVersion => "v1";
}
