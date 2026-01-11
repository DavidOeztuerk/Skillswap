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

  /// <summary>
  /// Field of study (e.g., "Computer Science", "Business Administration")
  /// </summary>
  [MaxLength(200)]
  public string? FieldOfStudy { get; private set; }

  public int? GraduationYear { get; private set; }

  /// <summary>
  /// Month of graduation (1-12). Combined with GraduationYear for full date.
  /// </summary>
  public int? GraduationMonth { get; private set; }

  /// <summary>
  /// Start year of education
  /// </summary>
  public int? StartYear { get; private set; }

  /// <summary>
  /// Start month of education (1-12)
  /// </summary>
  public int? StartMonth { get; private set; }

  [MaxLength(1000)]
  public string? Description { get; private set; }

  public int SortOrder { get; private set; } = 0;

  /// <summary>
  /// Values: "manual", "linkedin", "xing"
  /// </summary>
  [MaxLength(20)]
  public string Source { get; private set; } = ProfileDataSource.Manual;

  /// <summary>
  /// External ID from source (LinkedIn education ID, Xing education ID)
  /// </summary>
  [MaxLength(100)]
  public string? ExternalId { get; private set; }

  /// <summary>
  /// When this was imported from external source
  /// </summary>
  public DateTime? ImportedAt { get; private set; }

  // Navigation
  public virtual User? User { get; set; }

  // Helper for checking source
  public bool IsImported => Source != ProfileDataSource.Manual;
  public bool IsFromLinkedIn => Source == ProfileDataSource.LinkedIn;
  public bool IsFromXing => Source == ProfileDataSource.Xing;

  // Factory method
  public static UserEducation Create(
      string userId,
      string degree,
      string institution,
      int? graduationYear = null,
      int? graduationMonth = null,
      string? description = null,
      string? fieldOfStudy = null,
      int? startYear = null,
      int? startMonth = null,
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
      FieldOfStudy = fieldOfStudy,
      StartYear = startYear,
      StartMonth = startMonth,
      Description = description,
      SortOrder = sortOrder,
      Source = ProfileDataSource.Manual,
      CreatedAt = DateTime.UtcNow
    };
  }

  /// <summary>
  /// Create from LinkedIn import
  /// </summary>
  public static UserEducation CreateFromLinkedIn(
      string userId,
      string externalId,
      string degree,
      string institution,
      int? graduationYear = null,
      int? graduationMonth = null,
      string? description = null,
      string? fieldOfStudy = null,
      int? startYear = null,
      int? startMonth = null,
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
      FieldOfStudy = fieldOfStudy,
      StartYear = startYear,
      StartMonth = startMonth,
      Description = description,
      SortOrder = sortOrder,
      Source = ProfileDataSource.LinkedIn,
      ExternalId = externalId,
      ImportedAt = DateTime.UtcNow,
      CreatedAt = DateTime.UtcNow
    };
  }

  /// <summary>
  /// Create from Xing import
  /// </summary>
  public static UserEducation CreateFromXing(
      string userId,
      string externalId,
      string degree,
      string institution,
      int? graduationYear = null,
      int? graduationMonth = null,
      string? description = null,
      string? fieldOfStudy = null,
      int? startYear = null,
      int? startMonth = null,
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
      FieldOfStudy = fieldOfStudy,
      StartYear = startYear,
      StartMonth = startMonth,
      Description = description,
      SortOrder = sortOrder,
      Source = ProfileDataSource.Xing,
      ExternalId = externalId,
      ImportedAt = DateTime.UtcNow,
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
      string? fieldOfStudy,
      int? startYear,
      int? startMonth,
      int sortOrder)
  {
    Degree = degree;
    Institution = institution;
    GraduationYear = graduationYear;
    GraduationMonth = graduationMonth;
    FieldOfStudy = fieldOfStudy;
    StartYear = startYear;
    StartMonth = startMonth;
    Description = description;
    SortOrder = sortOrder;
    UpdatedAt = DateTime.UtcNow;
  }
}
