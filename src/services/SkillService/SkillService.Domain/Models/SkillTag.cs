using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;

namespace SkillService.Domain.Entities;

/// <summary>
/// Junction table for Skill tags (replaces TagsJson)
/// </summary>
public class SkillTag : AuditableEntity
{
    [Required]
    [MaxLength(450)]
    public string SkillId { get; set; } = string.Empty;

    /// <summary>
    /// The tag value (e.g., "beginner-friendly", "online", "certification")
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string Tag { get; set; } = string.Empty;

    /// <summary>
    /// Normalized tag for searching (lowercase, trimmed)
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string NormalizedTag { get; set; } = string.Empty;

    /// <summary>
    /// Sort order for display
    /// </summary>
    public int SortOrder { get; set; } = 0;

    // Navigation
    public virtual Skill Skill { get; set; } = null!;

    // Factory method
    public static SkillTag Create(string skillId, string tag, int sortOrder = 0)
    {
        return new SkillTag
        {
            SkillId = skillId,
            Tag = tag,
            NormalizedTag = tag.ToLowerInvariant().Trim(),
            SortOrder = sortOrder
        };
    }
}
