using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;

namespace SkillService.Domain.Entities;

/// <summary>
/// SkillCategory Entity
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

    // SEO properties
    [MaxLength(100)]
    public string? Slug { get; set; }

    // Navigation properties
    public virtual ICollection<Skill> Skills { get; set; } = [];
}
