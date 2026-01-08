using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;

namespace SkillService.Domain.Entities;

/// <summary>
/// Junction table for Skill preferred days (replaces PreferredDaysJson)
/// </summary>
public class SkillPreferredDay : AuditableEntity
{
    [Required]
    [MaxLength(450)]
    public string SkillId { get; set; } = string.Empty;

    /// <summary>
    /// Day of week: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string DayOfWeek { get; set; } = string.Empty;

    /// <summary>
    /// Sort order for display
    /// </summary>
    public int SortOrder { get; set; } = 0;

    // Navigation
    public virtual Skill Skill { get; set; } = null!;

    // Factory method
    public static SkillPreferredDay Create(string skillId, string dayOfWeek, int sortOrder = 0)
    {
        return new SkillPreferredDay
        {
            SkillId = skillId,
            DayOfWeek = dayOfWeek,
            SortOrder = sortOrder
        };
    }
}
