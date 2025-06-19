using System.ComponentModel.DataAnnotations;
using Infrastructure.Models;

namespace SkillService.Domain.Entities;

/// <summary>
/// Enhanced ProficiencyLevel with ranking and progression
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

    // Experience requirements
    public int? MinExperienceMonths { get; set; }
    public int? MaxExperienceMonths { get; set; }

    // Skills threshold
    public int? RequiredSkillCount { get; set; }

    // Navigation properties
    public virtual ICollection<Skill> Skills { get; set; } = new List<Skill>();

    // Helper properties
    public string DisplayName => Level;
    public bool IsBeginnerLevel => Rank <= 2;
    public bool IsIntermediateLevel => Rank == 3;
    public bool IsAdvancedLevel => Rank >= 4;
    public string BadgeClass => $"proficiency-{Rank}";
}
