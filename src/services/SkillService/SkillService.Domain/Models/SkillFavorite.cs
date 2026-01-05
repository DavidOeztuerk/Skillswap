using Domain.Abstractions;
using System.ComponentModel.DataAnnotations;

namespace SkillService.Domain.Entities;

/// <summary>
/// Represents a user's favorite skill.
/// Each user can favorite multiple skills, but cannot favorite the same skill twice.
/// </summary>
public class SkillFavorite : AuditableEntity
{
    [Required]
    [MaxLength(450)]
    public string UserId { get; private set; } = string.Empty;

    [Required]
    [MaxLength(450)]
    public string SkillId { get; private set; } = string.Empty;

    // Navigation property
    public virtual Skill Skill { get; private set; } = null!;

    // Private constructor for EF Core
    private SkillFavorite() { }

    /// <summary>
    /// Creates a new SkillFavorite instance.
    /// </summary>
    /// <param name="userId">The ID of the user favoriting the skill</param>
    /// <param name="skillId">The ID of the skill being favorited</param>
    /// <returns>A new SkillFavorite instance</returns>
    public static SkillFavorite Create(string userId, string skillId)
    {
        if (string.IsNullOrWhiteSpace(userId))
            throw new ArgumentException("UserId cannot be empty", nameof(userId));
        if (string.IsNullOrWhiteSpace(skillId))
            throw new ArgumentException("SkillId cannot be empty", nameof(skillId));

        return new SkillFavorite
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            SkillId = skillId,
            CreatedAt = DateTime.UtcNow
        };
    }
}
