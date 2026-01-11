using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Domain.Abstractions;

namespace SkillService.Domain.Entities;

/// <summary>
/// Mid-level category (e.g., "Web Development", "Mobile Apps", "Data Science")
/// Part of 3-level hierarchy: Category → Subcategory → Topic
/// </summary>
public class SkillSubcategory : AuditableEntity
{
  /// <summary>
  /// Parent category ID
  /// </summary>
  [Required]
  [MaxLength(450)]
  public string SkillCategoryId { get; set; } = string.Empty;

  [Required]
  [MaxLength(100)]
  public string Name { get; set; } = string.Empty;

  [MaxLength(500)]
  public string? Description { get; set; }

  [MaxLength(50)]
  public string? IconName { get; set; }

  public bool IsActive { get; set; } = true;

  /// <summary>
  /// Display order within parent category
  /// </summary>
  public int DisplayOrder { get; set; } = 0;

  // SEO properties
  [MaxLength(100)]
  public string? Slug { get; set; }

  // Navigation properties
  [ForeignKey(nameof(SkillCategoryId))]
  public virtual SkillCategory Category { get; set; } = null!;

  public virtual ICollection<SkillTopic> Topics { get; set; } = [];

  // Factory method
  public static SkillSubcategory Create(
      string categoryId,
      string name,
      string? description = null,
      string? iconName = null,
      int displayOrder = 0)
  {
    return new SkillSubcategory
    {
      Id = Guid.NewGuid().ToString(),
      SkillCategoryId = categoryId,
      Name = name,
      Description = description,
      IconName = iconName,
      DisplayOrder = displayOrder,
      Slug = GenerateSlug(name),
      CreatedAt = DateTime.UtcNow
    };
  }

  private static string GenerateSlug(string name)
  {
    return name.ToLowerInvariant()
        .Replace(" ", "-")
        .Replace("&", "and")
        .Replace("/", "-");
  }
}
