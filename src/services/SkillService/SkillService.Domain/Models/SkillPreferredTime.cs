using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;

namespace SkillService.Domain.Entities;

/// <summary>
/// Junction table for Skill preferred time slots (replaces PreferredTimesJson)
/// </summary>
public class SkillPreferredTime : AuditableEntity
{
    [Required]
    [MaxLength(450)]
    public string SkillId { get; set; } = string.Empty;

    /// <summary>
    /// Time slot: morning, afternoon, evening, night
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string TimeSlot { get; set; } = string.Empty;

    /// <summary>
    /// Optional: Specific start time (e.g., "09:00")
    /// </summary>
    [MaxLength(10)]
    public string? StartTime { get; set; }

    /// <summary>
    /// Optional: Specific end time (e.g., "12:00")
    /// </summary>
    [MaxLength(10)]
    public string? EndTime { get; set; }

    /// <summary>
    /// Sort order for display
    /// </summary>
    public int SortOrder { get; set; } = 0;

    // Navigation
    public virtual Skill Skill { get; set; } = null!;

    // Factory method
    public static SkillPreferredTime Create(string skillId, string timeSlot, int sortOrder = 0, string? startTime = null, string? endTime = null)
    {
        return new SkillPreferredTime
        {
            SkillId = skillId,
            TimeSlot = timeSlot,
            SortOrder = sortOrder,
            StartTime = startTime,
            EndTime = endTime
        };
    }
}
