using System.ComponentModel.DataAnnotations;
using Infrastructure.Models;

namespace NotificationService.Domain.Entities;

/// <summary>
/// Email templates
/// </summary>
public class EmailTemplate : AuditableEntity
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty; // welcome, email-verification, etc.

    [Required]
    [MaxLength(10)]
    public string Language { get; set; } = "en";

    [Required]
    [MaxLength(500)]
    public string Subject { get; set; } = string.Empty;

    [Required]
    public string HtmlContent { get; set; } = string.Empty;

    [Required]
    public string TextContent { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    [MaxLength(50)]
    public string Version { get; set; } = "1.0";

    // Template variables as JSON schema
    public string? VariablesSchema { get; set; }

    [MaxLength(1000)]
    public string? Description { get; set; }
}
