using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;

namespace UserService.Domain.Models;

/// <summary>
/// User preferences stored as separate entity (replaces User.PreferencesJson)
/// Note: Named UserPreferenceEntity to avoid conflict with existing UserPreferences DTO
/// </summary>
public class UserPreferenceEntity : AuditableEntity
{
    [Required]
    [MaxLength(450)]
    public string UserId { get; set; } = string.Empty;

    // =============================================
    // Display Preferences
    // =============================================

    /// <summary>
    /// UI Language (e.g., "en", "de", "fr")
    /// </summary>
    [MaxLength(10)]
    public string Language { get; set; } = "en";

    /// <summary>
    /// Theme preference: "light", "dark", "system"
    /// </summary>
    [MaxLength(20)]
    public string Theme { get; set; } = "light";

    /// <summary>
    /// Date format preference (e.g., "MM/dd/yyyy", "dd.MM.yyyy")
    /// </summary>
    [MaxLength(20)]
    public string DateFormat { get; set; } = "MM/dd/yyyy";

    /// <summary>
    /// Time format: "12h" or "24h"
    /// </summary>
    [MaxLength(10)]
    public string TimeFormat { get; set; } = "12h";

    // =============================================
    // Privacy Preferences
    // =============================================

    /// <summary>
    /// Show online status to other users
    /// </summary>
    public bool ShowOnlineStatus { get; set; } = true;

    /// <summary>
    /// Show profile to public (non-logged-in users)
    /// </summary>
    public bool PublicProfile { get; set; } = true;

    /// <summary>
    /// Allow others to see last active time
    /// </summary>
    public bool ShowLastActive { get; set; } = true;

    /// <summary>
    /// Allow search engines to index profile
    /// </summary>
    public bool AllowSearchEngineIndexing { get; set; } = false;

    /// <summary>
    /// Show skills on profile
    /// </summary>
    public bool ShowSkills { get; set; } = true;

    /// <summary>
    /// Show reviews on profile
    /// </summary>
    public bool ShowReviews { get; set; } = true;

    // =============================================
    // Communication Preferences
    // =============================================

    /// <summary>
    /// Allow messages from non-matched users
    /// </summary>
    public bool AllowMessagesFromAnyone { get; set; } = false;

    /// <summary>
    /// Auto-accept match requests (not recommended)
    /// </summary>
    public bool AutoAcceptMatches { get; set; } = false;

    // Navigation
    public virtual User User { get; set; } = null!;

    // Factory method
    public static UserPreferenceEntity CreateDefault(string userId)
    {
        return new UserPreferenceEntity
        {
            UserId = userId
        };
    }

    // Convert to DTO
    public UserPreferences ToDto()
    {
        return new UserPreferences
        {
            Language = Language,
            Theme = Theme,
            DateFormat = DateFormat,
            TimeFormat = TimeFormat,
            ShowOnlineStatus = ShowOnlineStatus,
            PrivacySettings = new Dictionary<string, bool>
            {
                ["publicProfile"] = PublicProfile,
                ["showLastActive"] = ShowLastActive,
                ["allowSearchEngineIndexing"] = AllowSearchEngineIndexing,
                ["showSkills"] = ShowSkills,
                ["showReviews"] = ShowReviews,
                ["allowMessagesFromAnyone"] = AllowMessagesFromAnyone,
                ["autoAcceptMatches"] = AutoAcceptMatches
            }
        };
    }
}
