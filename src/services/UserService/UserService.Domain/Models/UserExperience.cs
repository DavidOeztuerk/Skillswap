using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;

namespace UserService.Domain.Models;

/// <summary>
/// Represents a user's work experience entry for their public profile
/// </summary>
public class UserExperience : AuditableEntity
{
    [Required]
    public string UserId { get; private set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Title { get; private set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Company { get; private set; } = string.Empty;

    public DateTime StartDate { get; private set; }

    public DateTime? EndDate { get; private set; }

    [MaxLength(1000)]
    public string? Description { get; private set; }

    public int SortOrder { get; private set; } = 0;

    // Navigation
    public virtual User? User { get; set; }

    // Computed property
    public bool IsCurrent => EndDate == null;

    // Factory method
    public static UserExperience Create(
        string userId,
        string title,
        string company,
        DateTime startDate,
        DateTime? endDate = null,
        string? description = null,
        int sortOrder = 0)
    {
        return new UserExperience
        {
            Id = Guid.NewGuid().ToString(),
            UserId = userId,
            Title = title,
            Company = company,
            StartDate = startDate,
            EndDate = endDate,
            Description = description,
            SortOrder = sortOrder,
            CreatedAt = DateTime.UtcNow
        };
    }

    // Update method
    public void Update(
        string title,
        string company,
        DateTime startDate,
        DateTime? endDate,
        string? description,
        int sortOrder)
    {
        Title = title;
        Company = company;
        StartDate = startDate;
        EndDate = endDate;
        Description = description;
        SortOrder = sortOrder;
        UpdatedAt = DateTime.UtcNow;
    }
}
