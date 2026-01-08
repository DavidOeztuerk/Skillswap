using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Domain.Abstractions;

namespace SkillService.Domain.Entities;

/// <summary>
/// Specific topic (e.g., "React", "Python", "Machine Learning")
/// Part of 3-level hierarchy: Category → Subcategory → Topic
/// Phase 11 - Category Hierarchy Implementation
/// Skills are linked directly to Topics.
/// </summary>
public class SkillTopic : AuditableEntity
{
    /// <summary>
    /// Parent subcategory ID
    /// </summary>
    [Required]
    [MaxLength(450)]
    public string SkillSubcategoryId { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(50)]
    public string? IconName { get; set; }

    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Display order within parent subcategory
    /// </summary>
    public int DisplayOrder { get; set; } = 0;

    /// <summary>
    /// Whether this topic is popular/featured
    /// </summary>
    public bool IsFeatured { get; set; } = false;

    // SEO properties
    [MaxLength(100)]
    public string? Slug { get; set; }

    /// <summary>
    /// Comma-separated related keywords for search
    /// </summary>
    [MaxLength(500)]
    public string? Keywords { get; set; }

    // Navigation properties
    [ForeignKey(nameof(SkillSubcategoryId))]
    public virtual SkillSubcategory Subcategory { get; set; } = null!;

    public virtual ICollection<Skill> Skills { get; set; } = [];

    // Computed property to get full hierarchy path
    [NotMapped]
    public string FullPath => Subcategory != null && Subcategory.Category != null
        ? $"{Subcategory.Category.Name} > {Subcategory.Name} > {Name}"
        : Name;

    // Factory method
    public static SkillTopic Create(
        string subcategoryId,
        string name,
        string? description = null,
        string? iconName = null,
        string? keywords = null,
        int displayOrder = 0,
        bool isFeatured = false)
    {
        return new SkillTopic
        {
            Id = Guid.NewGuid().ToString(),
            SkillSubcategoryId = subcategoryId,
            Name = name,
            Description = description,
            IconName = iconName,
            Keywords = keywords,
            DisplayOrder = displayOrder,
            IsFeatured = isFeatured,
            Slug = GenerateSlug(name),
            CreatedAt = DateTime.UtcNow
        };
    }

    private static string GenerateSlug(string name)
    {
        return name.ToLowerInvariant()
            .Replace(" ", "-")
            .Replace("&", "and")
            .Replace("/", "-")
            .Replace("#", "sharp")
            .Replace("+", "plus");
    }
}
