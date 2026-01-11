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

  [MaxLength(100)]
  public string? Location { get; private set; }

  public DateTime StartDate { get; private set; }

  public DateTime? EndDate { get; private set; }

  [MaxLength(1000)]
  public string? Description { get; private set; }

  public int SortOrder { get; private set; } = 0;

  /// <summary>
  /// Values: "manual", "linkedin", "xing"
  /// </summary>
  [MaxLength(20)]
  public string Source { get; private set; } = ProfileDataSource.Manual;

  /// <summary>
  /// External ID from source (LinkedIn position ID, Xing experience ID)
  /// </summary>
  [MaxLength(100)]
  public string? ExternalId { get; private set; }

  /// <summary>
  /// When this was imported from external source
  /// </summary>
  public DateTime? ImportedAt { get; private set; }

  // Navigation
  public virtual User? User { get; set; }

  // Computed property
  public bool IsCurrent => EndDate == null;

  // Helper for checking source
  public bool IsImported => Source != ProfileDataSource.Manual;
  public bool IsFromLinkedIn => Source == ProfileDataSource.LinkedIn;
  public bool IsFromXing => Source == ProfileDataSource.Xing;

  // Factory method
  public static UserExperience Create(
      string userId,
      string title,
      string company,
      DateTime startDate,
      DateTime? endDate = null,
      string? description = null,
      string? location = null,
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
      Location = location,
      SortOrder = sortOrder,
      Source = ProfileDataSource.Manual,
      CreatedAt = DateTime.UtcNow
    };
  }

  /// <summary>
  /// Create from LinkedIn import
  /// </summary>
  public static UserExperience CreateFromLinkedIn(
      string userId,
      string externalId,
      string title,
      string company,
      DateTime startDate,
      DateTime? endDate = null,
      string? description = null,
      string? location = null,
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
      Location = location,
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
  public static UserExperience CreateFromXing(
      string userId,
      string externalId,
      string title,
      string company,
      DateTime startDate,
      DateTime? endDate = null,
      string? description = null,
      string? location = null,
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
      Location = location,
      SortOrder = sortOrder,
      Source = ProfileDataSource.Xing,
      ExternalId = externalId,
      ImportedAt = DateTime.UtcNow,
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
      string? location,
      int sortOrder)
  {
    Title = title;
    Company = company;
    StartDate = startDate;
    EndDate = endDate;
    Description = description;
    Location = location;
    SortOrder = sortOrder;
    UpdatedAt = DateTime.UtcNow;
  }
}
