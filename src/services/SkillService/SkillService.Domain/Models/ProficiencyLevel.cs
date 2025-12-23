using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;

namespace SkillService.Domain.Entities;

/// <summary>
/// ProficiencyLevel Entity
/// </summary>
public class ProficiencyLevel : AuditableEntity
{
    [Required]
    [MaxLength(30)]
    public string Level { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [Required]
    public int Rank { get; set; } = 1; // 1 = Beginner, 5 = Expert

    [MaxLength(7)]
    public string? Color { get; set; } // Hex color code

    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual ICollection<Skill> Skills { get; set; } = [];
}
