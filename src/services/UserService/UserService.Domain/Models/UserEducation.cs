using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;

namespace UserService.Domain.Models;

/// <summary>
/// Represents a user's education entry for their public profile
/// </summary>
public class UserEducation : AuditableEntity
{
    [Required]
    public string UserId { get; private set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Degree { get; private set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Institution { get; private set; } = string.Empty;

    public int? GraduationYear { get; private set; }

    /// <summary>
    /// Month of graduation (1-12). Combined with GraduationYear for full date.
    /// </summary>
    public int? GraduationMonth { get; private set; }

    [MaxLength(1000)]
    public string? Description { get; private set; }

    public int SortOrder { get; private set; } = 0;

    // Navigation
    public virtual User? User { get; set; }

    // Factory method
    public static UserEducation Create(
        string userId,
        string degree,
        string institution,
        int? graduationYear = null,
        int? graduationMonth = null,
        string? description = null,
        int sortOrder = 0)
    {
        return new UserEducation
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            Degree = degree,
            Institution = institution,
            GraduationYear = graduationYear,
            GraduationMonth = graduationMonth,
            Description = description,
            SortOrder = sortOrder,
            CreatedAt = DateTime.UtcNow
        };
    }

    // Update method
    public void Update(
        string degree,
        string institution,
        int? graduationYear,
        int? graduationMonth,
        string? description,
        int sortOrder)
    {
        Degree = degree;
        Institution = institution;
        GraduationYear = graduationYear;
        GraduationMonth = graduationMonth;
        Description = description;
        SortOrder = sortOrder;
        UpdatedAt = DateTime.UtcNow;
    }
}
