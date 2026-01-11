namespace SkillService.Domain.Configuration;

/// <summary>
/// Configuration settings for listing expiration and lifecycle management
/// </summary>
public class ListingSettings
{
  public const string SectionName = "ListingSettings";

  /// <summary>
  /// Default expiration time for new listings (in minutes)
  /// Default: 86400 (60 days)
  /// Development: 5 (5 minutes for testing)
  /// </summary>
  public int DefaultExpirationMinutes { get; set; } = 86400; // 60 days

  /// <summary>
  /// Time before expiration to send warning notification (in minutes)
  /// Default: 10080 (7 days)
  /// Development: 2 (2 minutes for testing)
  /// </summary>
  public int ExpiringWarningMinutes { get; set; } = 10080; // 7 days

  /// <summary>
  /// Time after expiration before hard delete (in minutes)
  /// Default: 43200 (30 days)
  /// Development: 3 (3 minutes for testing)
  /// </summary>
  public int HardDeleteAfterMinutes { get; set; } = 43200; // 30 days

  /// <summary>
  /// Interval between expiration checks (in minutes)
  /// Default: 60 (1 hour)
  /// Development: 1 (1 minute for testing)
  /// </summary>
  public int CheckIntervalMinutes { get; set; } = 60; // 1 hour

  /// <summary>
  /// Default boost duration (in minutes)
  /// Default: 10080 (7 days)
  /// </summary>
  public int DefaultBoostDurationMinutes { get; set; } = 10080; // 7 days

  /// <summary>
  /// Enable/disable background service for testing
  /// </summary>
  public bool EnableBackgroundService { get; set; } = true;

  /// <summary>
  /// Enable/disable notifications for testing
  /// </summary>
  public bool EnableNotifications { get; set; } = true;
}
