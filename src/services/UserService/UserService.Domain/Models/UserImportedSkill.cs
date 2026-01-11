using Domain.Abstractions;
using System.ComponentModel.DataAnnotations;

namespace UserService.Domain.Models;

/// <summary>
/// Represents a professional skill imported from LinkedIn/Xing or manually added by the user.
/// These are "competencies" (e.g., JavaScript, Project Management) - distinct from
/// Skills in SkillService which are teaching/learning offers.
/// </summary>
public class UserImportedSkill : AuditableEntity
{
    [Required]
    [MaxLength(450)]
    public string UserId { get; private set; } = string.Empty;

    /// <summary>
    /// Name of the skill/competency (e.g., "JavaScript", "Project Management")
    /// </summary>
    [Required]
    [MaxLength(200)]
    public string Name { get; private set; } = string.Empty;

    /// <summary>
    /// Normalized name for deduplication (lowercase, trimmed)
    /// </summary>
    [Required]
    [MaxLength(200)]
    public string NormalizedName { get; private set; } = string.Empty;

    /// <summary>
    /// Source of this skill entry
    /// Values: "manual", "linkedin", "xing"
    /// </summary>
    [MaxLength(20)]
    public string Source { get; private set; } = ProfileDataSource.Manual;

    /// <summary>
    /// External ID from source (LinkedIn skill URN, Xing skill ID)
    /// </summary>
    [MaxLength(100)]
    public string? ExternalId { get; private set; }

    /// <summary>
    /// Number of endorsements from LinkedIn/Xing
    /// </summary>
    public int EndorsementCount { get; private set; } = 0;

    /// <summary>
    /// When this was imported from external source
    /// </summary>
    public DateTime? ImportedAt { get; private set; }

    /// <summary>
    /// Last sync time from external source
    /// </summary>
    public DateTime? LastSyncAt { get; private set; }

    /// <summary>
    /// Category of the skill (if available from source)
    /// e.g., "Programming", "Management", "Design"
    /// </summary>
    [MaxLength(100)]
    public string? Category { get; private set; }

    /// <summary>
    /// Display order for manual sorting
    /// </summary>
    public int SortOrder { get; private set; } = 0;

    /// <summary>
    /// Whether to display this skill on profile
    /// </summary>
    public bool IsVisible { get; private set; } = true;

    // Navigation
    public virtual User? User { get; set; }

    // Helper properties
    public bool IsImported => Source != ProfileDataSource.Manual;
    public bool IsFromLinkedIn => Source == ProfileDataSource.LinkedIn;
    public bool IsFromXing => Source == ProfileDataSource.Xing;
    public bool IsManual => Source == ProfileDataSource.Manual;

    // Factory method for manual creation
    public static UserImportedSkill Create(
        string userId,
        string name,
        string? category = null,
        int sortOrder = 0)
    {
        return new UserImportedSkill
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            Name = name.Trim(),
            NormalizedName = name.Trim().ToLowerInvariant(),
            Source = ProfileDataSource.Manual,
            Category = category,
            SortOrder = sortOrder,
            IsVisible = true,
            CreatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Create from LinkedIn import
    /// </summary>
    public static UserImportedSkill CreateFromLinkedIn(
        string userId,
        string externalId,
        string name,
        int endorsementCount = 0,
        string? category = null,
        int sortOrder = 0)
    {
        return new UserImportedSkill
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            Name = name.Trim(),
            NormalizedName = name.Trim().ToLowerInvariant(),
            Source = ProfileDataSource.LinkedIn,
            ExternalId = externalId,
            EndorsementCount = endorsementCount,
            Category = category,
            SortOrder = sortOrder,
            IsVisible = true,
            ImportedAt = DateTime.UtcNow,
            LastSyncAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Create from Xing import
    /// </summary>
    public static UserImportedSkill CreateFromXing(
        string userId,
        string externalId,
        string name,
        int endorsementCount = 0,
        string? category = null,
        int sortOrder = 0)
    {
        return new UserImportedSkill
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            Name = name.Trim(),
            NormalizedName = name.Trim().ToLowerInvariant(),
            Source = ProfileDataSource.Xing,
            ExternalId = externalId,
            EndorsementCount = endorsementCount,
            Category = category,
            SortOrder = sortOrder,
            IsVisible = true,
            ImportedAt = DateTime.UtcNow,
            LastSyncAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
    }

    // Update methods
    public void Update(string name, string? category, int sortOrder, bool isVisible)
    {
        Name = name.Trim();
        NormalizedName = name.Trim().ToLowerInvariant();
        Category = category;
        SortOrder = sortOrder;
        IsVisible = isVisible;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateFromSync(int endorsementCount)
    {
        EndorsementCount = endorsementCount;
        LastSyncAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetVisibility(bool isVisible)
    {
        IsVisible = isVisible;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetSortOrder(int sortOrder)
    {
        SortOrder = sortOrder;
        UpdatedAt = DateTime.UtcNow;
    }
}
