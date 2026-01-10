using Domain.Abstractions;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SkillService.Domain.Entities;

/// <summary>
/// Represents a published listing of a skill.
/// Phase 10: Listing concept - Skills can be listed with expiration.
///
/// A Skill represents the user's capability, while a Listing represents
/// the active publication of that skill for matching.
///
/// Relationship: Skill (1) ←→ (1) Listing
/// </summary>
public class Listing : AuditableEntity
{
    // =============================================
    // Core Properties
    // =============================================

    /// <summary>
    /// The skill being listed
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string SkillId { get; set; } = string.Empty;

    /// <summary>
    /// Owner of the listing (denormalized for performance)
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// Type of listing: Offer (teaching) or Request (learning)
    /// Replaces the old Skill.IsOffered boolean
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string Type { get; set; } = ListingType.Offer;

    // =============================================
    // Expiration & Refresh
    // =============================================

    /// <summary>
    /// When the listing expires and becomes invisible
    /// Default: 60 days from creation
    /// Development: 5 minutes for testing
    /// </summary>
    [Required]
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// When the listing was last refreshed
    /// </summary>
    public DateTime? RefreshedAt { get; set; }

    /// <summary>
    /// Number of times the listing has been refreshed
    /// Maximum: 5 times without waiting period
    /// </summary>
    public int RefreshCount { get; set; } = 0;

    /// <summary>
    /// Maximum number of refreshes allowed
    /// </summary>
    public const int MaxRefreshCount = 5;

    /// <summary>
    /// Flag to track if expiring notification was sent
    /// Prevents duplicate notifications
    /// </summary>
    public bool ExpiringNotificationSent { get; set; } = false;

    // =============================================
    // Boost (Premium Feature) - Phase 11
    // =============================================

    /// <summary>
    /// Whether the listing is currently boosted for higher visibility
    /// </summary>
    public bool IsBoosted { get; set; } = false;

    /// <summary>
    /// When the boost expires
    /// </summary>
    public DateTime? BoostedUntil { get; set; }

    /// <summary>
    /// Total number of boosts used on this listing
    /// </summary>
    public int BoostCount { get; set; } = 0;

    /// <summary>
    /// Type of boost applied: Refresh, Highlight, TopListing, Gallery
    /// </summary>
    [MaxLength(50)]
    public string? BoostType { get; set; }

    /// <summary>
    /// Whether the listing is highlighted (colored background)
    /// </summary>
    public bool IsHighlighted { get; set; } = false;

    /// <summary>
    /// Whether the listing appears in top positions
    /// </summary>
    public bool IsTopListing { get; set; } = false;

    /// <summary>
    /// Whether the listing appears in the homepage gallery
    /// </summary>
    public bool IsInGallery { get; set; } = false;

    // =============================================
    // Status
    // =============================================

    /// <summary>
    /// Current status of the listing
    /// Active → Expiring → Expired → Deleted
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = ListingStatus.Active;

    /// <summary>
    /// When the listing was closed (if manually closed)
    /// </summary>
    public DateTime? ClosedAt { get; set; }

    /// <summary>
    /// Reason for closure (optional)
    /// </summary>
    [MaxLength(500)]
    public string? ClosureReason { get; set; }

    // =============================================
    // Navigation Properties
    // =============================================

    /// <summary>
    /// Navigation to the associated skill
    /// </summary>
    [ForeignKey(nameof(SkillId))]
    public virtual Skill Skill { get; set; } = null!;

    // =============================================
    // Computed Properties
    // =============================================

    /// <summary>
    /// Whether the listing is visible in public search
    /// </summary>
    [NotMapped]
    public bool IsVisible => ListingStatus.IsVisible(Status) && !IsDeleted;

    /// <summary>
    /// Whether the listing can be refreshed
    /// </summary>
    [NotMapped]
    public bool CanRefresh => RefreshCount < MaxRefreshCount && Status != ListingStatus.Deleted;

    /// <summary>
    /// Refreshes remaining before hitting the limit
    /// </summary>
    [NotMapped]
    public int RefreshesRemaining => Math.Max(0, MaxRefreshCount - RefreshCount);

    /// <summary>
    /// Days until expiration (negative if expired)
    /// </summary>
    [NotMapped]
    public int DaysUntilExpiration => (int)(ExpiresAt - DateTime.UtcNow).TotalDays;

    /// <summary>
    /// Whether the listing is currently boosted
    /// </summary>
    [NotMapped]
    public bool IsCurrentlyBoosted => IsBoosted && BoostedUntil.HasValue && BoostedUntil.Value > DateTime.UtcNow;

    /// <summary>
    /// Whether this is an offer (teaching) listing
    /// </summary>
    [NotMapped]
    public bool IsOffer => Type == ListingType.Offer;

    /// <summary>
    /// Whether this is a request (learning) listing
    /// </summary>
    [NotMapped]
    public bool IsRequest => Type == ListingType.Request;

    // =============================================
    // Factory Methods
    // =============================================

    /// <summary>
    /// Create a new listing for a skill
    /// </summary>
    /// <param name="skillId">The skill to list</param>
    /// <param name="userId">Owner of the skill</param>
    /// <param name="type">Offer or Request</param>
    /// <param name="expirationMinutes">Minutes until expiration (default: 86400 = 60 days)</param>
    public static Listing Create(
        string skillId,
        string userId,
        string type,
        int expirationMinutes = 86400) // 60 days = 60 * 24 * 60
    {
        return new Listing
        {
            Id = Guid.NewGuid().ToString(),
            SkillId = skillId,
            UserId = userId,
            Type = type,
            Status = ListingStatus.Active,
            ExpiresAt = DateTime.UtcNow.AddMinutes(expirationMinutes),
            CreatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Create from an existing skill (migration helper)
    /// </summary>
    public static Listing CreateFromSkill(Skill skill, int expirationMinutes = 86400)
    {
        return Create(
            skill.Id,
            skill.UserId,
            ListingType.FromIsOffered(skill.IsOffered),
            expirationMinutes
        );
    }

    // =============================================
    // Business Methods
    // =============================================

    /// <summary>
    /// Refresh the listing, extending its expiration
    /// </summary>
    /// <param name="additionalMinutes">Minutes to add to current time</param>
    /// <returns>True if refresh was successful</returns>
    public bool Refresh(int additionalMinutes = 86400)
    {
        if (!CanRefresh)
            return false;

        ExpiresAt = DateTime.UtcNow.AddMinutes(additionalMinutes);
        RefreshedAt = DateTime.UtcNow;
        RefreshCount++;

        // If it was expiring, move back to active
        if (Status == ListingStatus.Expiring)
        {
            Status = ListingStatus.Active;
            ExpiringNotificationSent = false;
        }

        UpdatedAt = DateTime.UtcNow;
        return true;
    }

    /// <summary>
    /// Boost the listing for higher visibility
    /// </summary>
    /// <param name="durationMinutes">How long the boost lasts</param>
    /// <param name="boostType">Type of boost: Refresh, Highlight, TopListing, Gallery</param>
    public void Boost(int durationMinutes, string? boostType = null)
    {
        IsBoosted = true;
        BoostedUntil = DateTime.UtcNow.AddMinutes(durationMinutes);
        BoostCount++;
        BoostType = boostType;

        // Set specific boost flags based on type
        switch (boostType)
        {
            case "Refresh":
                RefreshedAt = DateTime.UtcNow;
                break;
            case "Highlight":
                IsHighlighted = true;
                break;
            case "TopListing":
                IsTopListing = true;
                break;
            case "Gallery":
                IsInGallery = true;
                break;
        }

        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Remove boost from the listing
    /// </summary>
    public void RemoveBoost()
    {
        IsBoosted = false;
        BoostedUntil = null;
        BoostType = null;
        IsHighlighted = false;
        IsTopListing = false;
        IsInGallery = false;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Mark the listing as expiring (7 days or less remaining)
    /// </summary>
    public void MarkAsExpiring()
    {
        if (Status == ListingStatus.Active)
        {
            Status = ListingStatus.Expiring;
            UpdatedAt = DateTime.UtcNow;
        }
    }

    /// <summary>
    /// Mark the listing as expired
    /// </summary>
    public void Expire()
    {
        Status = ListingStatus.Expired;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Close the listing manually
    /// </summary>
    /// <param name="reason">Optional reason for closure</param>
    public void Close(string? reason = null)
    {
        Status = ListingStatus.Closed;
        ClosedAt = DateTime.UtcNow;
        ClosureReason = reason;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Soft-delete the listing
    /// </summary>
    public void SoftDelete(string? deletedBy = null)
    {
        Status = ListingStatus.Deleted;
        IsDeleted = true;
        DeletedAt = DateTime.UtcNow;
        DeletedBy = deletedBy;
    }

    /// <summary>
    /// Reactivate a closed or expired listing
    /// </summary>
    /// <param name="expirationMinutes">New expiration time</param>
    /// <returns>True if reactivation was successful</returns>
    public bool Reactivate(int expirationMinutes = 86400)
    {
        if (Status == ListingStatus.Deleted)
            return false;

        Status = ListingStatus.Active;
        ExpiresAt = DateTime.UtcNow.AddMinutes(expirationMinutes);
        ClosedAt = null;
        ClosureReason = null;
        ExpiringNotificationSent = false;
        UpdatedAt = DateTime.UtcNow;
        return true;
    }

    /// <summary>
    /// Mark that expiring notification was sent
    /// </summary>
    public void MarkExpiringNotificationSent()
    {
        ExpiringNotificationSent = true;
        UpdatedAt = DateTime.UtcNow;
    }
}
