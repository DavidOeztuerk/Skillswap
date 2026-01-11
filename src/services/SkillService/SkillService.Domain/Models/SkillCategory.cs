using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;

namespace SkillService.Domain.Entities;

/// <summary>
/// Top-level category (e.g., "Development", "Business", "Design")
/// Part of 3-level hierarchy: Category → Subcategory → Topic
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

  public bool IsActive { get; set; } = true;

  /// <summary>
  /// Display order for sorting categories
  /// </summary>
  public int DisplayOrder { get; set; } = 0;

  // SEO properties
  [MaxLength(100)]
  public string? Slug { get; set; }

  // Navigation properties
  public virtual ICollection<SkillSubcategory> Subcategories { get; set; } = [];

  // Note: Direct Skill navigation removed in Phase 11 - Skills now link via Topic
}
