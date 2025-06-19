using Infrastructure.Models;
using System.ComponentModel.DataAnnotations;

namespace SkillService.Domain.Entities;

/// <summary>
/// Skill endorsements from other users
/// </summary>
public class SkillEndorsement : AuditableEntity
{
    [Required]
    [MaxLength(450)]
    public string SkillId { get; set; } = string.Empty;

    [Required]
    [MaxLength(450)]
    public string EndorserUserId { get; set; } = string.Empty;

    [Required]
    [MaxLength(450)]
    public string EndorsedUserId { get; set; } = string.Empty; // Owner of the skill

    [MaxLength(500)]
    public string? Message { get; set; }

    [MaxLength(100)]
    public string? Relationship { get; set; } // "colleague", "mentor", "student", etc.

    public bool IsVisible { get; set; } = true;

    // Navigation properties
    public virtual Skill Skill { get; set; } = null!;

    // Helper properties
    public bool HasMessage => !string.IsNullOrEmpty(Message);
    public bool HasRelationship => !string.IsNullOrEmpty(Relationship);
}
