using Domain.Abstractions;

namespace PaymentService.Domain.Entities;

/// <summary>
/// Payment product definition (e.g., boost options)
/// </summary>
public class PaymentProduct : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ProductType { get; set; } = string.Empty;  // e.g., "ListingBoost"
    public string BoostType { get; set; } = string.Empty;    // e.g., "Refresh", "Highlight", "TopListing", "Gallery"

    public decimal Price { get; set; }
    public string Currency { get; set; } = "EUR";

    public int DurationDays { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }

    public string? StripePriceId { get; set; }

    // Navigation
    public virtual ICollection<Payment> Payments { get; set; } = [];
}
