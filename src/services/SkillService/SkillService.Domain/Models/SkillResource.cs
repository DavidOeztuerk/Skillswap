using Domain.Abstractions;
using System.ComponentModel.DataAnnotations;

namespace SkillService.Domain.Entities;

/// <summary>
/// Skill learning resources and materials
/// </summary>
public class SkillResource : AuditableEntity
{
    [Required]
    [MaxLength(450)]
    public string SkillId { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [Required]
    [MaxLength(50)]
    public string Type { get; set; } = string.Empty; // "video", "article", "book", "course", etc.

    [MaxLength(500)]
    public string? Url { get; set; }

    [MaxLength(500)]
    public string? FilePath { get; set; }

    public bool IsFree { get; set; } = true;

    public decimal? Price { get; set; }

    [MaxLength(10)]
    public string? Currency { get; set; }

    public int? DurationMinutes { get; set; }

    [MaxLength(50)]
    public string? Language { get; set; } = "en";

    [MaxLength(50)]
    public string? DifficultyLevel { get; set; }

    public double? Rating { get; set; }

    public int RatingCount { get; set; } = 0;

    public bool IsActive { get; set; } = true;

    // Navigation properties
    public virtual Skill Skill { get; set; } = null!;

    // Helper properties
    public bool HasUrl => !string.IsNullOrEmpty(Url);
    public bool HasFile => !string.IsNullOrEmpty(FilePath);
    public bool IsPaid => Price.HasValue && Price.Value > 0;
    public bool IsHighlyRated => Rating >= 4.0;
    public TimeSpan? Duration => DurationMinutes.HasValue
        ? TimeSpan.FromMinutes(DurationMinutes.Value)
        : null;
}
