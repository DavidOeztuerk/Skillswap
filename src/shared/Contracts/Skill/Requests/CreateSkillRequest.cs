using System.ComponentModel.DataAnnotations;
using Contracts.Common;

namespace Contracts.Skill.Requests;

/// <summary>
/// API request for creating a new skill
/// </summary>
public record CreateSkillRequest(
    [Required(ErrorMessage = "Skill name is required")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Skill name must be between 2 and 100 characters")]
    string Name,

    [Required(ErrorMessage = "Description is required")]
    [StringLength(2000, MinimumLength = 10, ErrorMessage = "Description must be between 10 and 2000 characters")]
    string Description,

    [Required(ErrorMessage = "Category ID is required")]
    string CategoryId,

    List<string> Tags,

    [Required(ErrorMessage = "Must specify if skill is offered")]
    bool IsOffered,

    // Legacy fields (optional)
    [Range(1, 40, ErrorMessage = "Available hours must be between 1 and 40 per week")]
    int? AvailableHours = null,

    [Range(15, 480, ErrorMessage = "Session duration must be between 15 and 480 minutes")]
    int? PreferredSessionDuration = 60,

    // ==========================================================================
    // EXCHANGE OPTIONS
    // ==========================================================================

    /// <summary>
    /// Type of exchange: 'skill_exchange' (default) or 'payment'
    /// </summary>
    string? ExchangeType = "skill_exchange",

    /// <summary>
    /// For skill_exchange: Category of the desired skill in return
    /// </summary>
    string? DesiredSkillCategoryId = null,

    /// <summary>
    /// For skill_exchange: Description of what skill the user wants in return
    /// </summary>
    [StringLength(500, ErrorMessage = "Desired skill description cannot exceed 500 characters")]
    string? DesiredSkillDescription = null,

    /// <summary>
    /// For payment: Hourly rate (only when IsOffered=true)
    /// </summary>
    [Range(5, 500, ErrorMessage = "Hourly rate must be between 5 and 500")]
    decimal? HourlyRate = null,

    /// <summary>
    /// For payment: Currency code (EUR, USD, CHF, GBP)
    /// </summary>
    [StringLength(3, ErrorMessage = "Currency must be 3 characters")]
    string? Currency = "EUR",

    // ==========================================================================
    // SCHEDULING
    // ==========================================================================

    /// <summary>
    /// Preferred days of the week (monday, tuesday, etc.)
    /// </summary>
    List<string>? PreferredDays = null,

    /// <summary>
    /// Preferred times of day (morning, afternoon, evening)
    /// </summary>
    List<string>? PreferredTimes = null,

    /// <summary>
    /// Duration of each session in minutes (15, 30, 45, 60, 90, 120)
    /// </summary>
    [Range(15, 120, ErrorMessage = "Session duration must be between 15 and 120 minutes")]
    int SessionDurationMinutes = 60,

    /// <summary>
    /// Total number of sessions
    /// </summary>
    [Range(1, 50, ErrorMessage = "Total sessions must be between 1 and 50")]
    int TotalSessions = 1,

    // ==========================================================================
    // LOCATION
    // ==========================================================================

    /// <summary>
    /// Location type: 'remote' (default), 'in_person', or 'both'
    /// </summary>
    string? LocationType = "remote",

    /// <summary>
    /// Street address (for in_person or both)
    /// </summary>
    [StringLength(200, ErrorMessage = "Address cannot exceed 200 characters")]
    string? LocationAddress = null,

    /// <summary>
    /// City name
    /// </summary>
    [StringLength(100, ErrorMessage = "City name cannot exceed 100 characters")]
    string? LocationCity = null,

    /// <summary>
    /// Postal code
    /// </summary>
    [StringLength(20, ErrorMessage = "Postal code cannot exceed 20 characters")]
    string? LocationPostalCode = null,

    /// <summary>
    /// Country code (ISO 3166-1 alpha-2, e.g., "DE")
    /// </summary>
    [StringLength(2, ErrorMessage = "Country must be 2-letter ISO code")]
    string? LocationCountry = null,

    /// <summary>
    /// Maximum distance in km for in-person meetings
    /// </summary>
    [Range(1, 500, ErrorMessage = "Max distance must be between 1 and 500 km")]
    int MaxDistanceKm = 50)
    : IVersionedContract
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
