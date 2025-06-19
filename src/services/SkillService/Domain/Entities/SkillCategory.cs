using System.ComponentModel.DataAnnotations;
using Infrastructure.Models;

namespace SkillService.Domain.Entities;

/// <summary>
/// Enhanced SkillCategory with additional metadata
/// </summary>
public class SkillCategory : AuditableEntity
{
    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(50)]
    public string? IconName { get; set; }

    [MaxLength(7)]
    public string? Color { get; set; } // Hex color code

    public int SortOrder { get; set; } = 0;

    public bool IsActive { get; set; } = true;

    public bool IsFeatured { get; set; } = false;

    // SEO properties
    [MaxLength(100)]
    public string? Slug { get; set; }

    [MaxLength(200)]
    public string? MetaDescription { get; set; }

    // Statistics
    public int SkillCount { get; set; } = 0;
    public int ActiveSkillCount { get; set; } = 0;

    // Navigation properties
    public virtual ICollection<Skill> Skills { get; set; } = new List<Skill>();

    // Helper properties
    public string DisplayName => Name;
    public string CssClass => $"category-{Slug ?? Name.ToLowerInvariant().Replace(" ", "-")}";
    public bool HasIcon => !string.IsNullOrEmpty(IconName);
    public bool HasCustomColor => !string.IsNullOrEmpty(Color);
}
