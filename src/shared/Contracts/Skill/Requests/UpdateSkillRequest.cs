using System.ComponentModel.DataAnnotations;
using Contracts.Common;

namespace Contracts.Skill.Requests;

/// <summary>
/// API request for updating an existing skill.
/// Includes Exchange, Scheduling, and Location options.
/// </summary>
public record UpdateSkillRequest(
    [Required(ErrorMessage = "Skill ID is required")]
    string SkillId,

    [StringLength(100, MinimumLength = 2, ErrorMessage = "Skill name must be between 2 and 100 characters")]
    string Name,

    [StringLength(1000, MinimumLength = 10, ErrorMessage = "Description must be between 10 and 1000 characters")]
    string Description,

    string CategoryId,

    List<string> Tags,

    bool IsOffered,

    [Range(1, 40, ErrorMessage = "Available hours must be between 1 and 40 per week")]
    int? AvailableHours = null,

    [Range(15, 480, ErrorMessage = "Session duration must be between 15 and 480 minutes")]
    int? PreferredSessionDuration = null,

    // ========================================
    // EXCHANGE OPTIONS
    // ========================================

    /// <summary>Exchange type: skill_exchange or payment</summary>
    string? ExchangeType = null,

    /// <summary>Desired skill category/topic ID for exchange</summary>
    string? DesiredSkillCategoryId = null,

    /// <summary>Description of desired skill for exchange</summary>
    string? DesiredSkillDescription = null,

    /// <summary>Hourly rate for payment exchange type</summary>
    decimal? HourlyRate = null,

    /// <summary>Currency code (EUR, USD, CHF, GBP)</summary>
    string? Currency = null,

    // ========================================
    // SCHEDULING
    // ========================================

    /// <summary>Preferred days of the week</summary>
    List<string>? PreferredDays = null,

    /// <summary>Preferred times of day (morning, afternoon, evening)</summary>
    List<string>? PreferredTimes = null,

    /// <summary>Duration of each session in minutes</summary>
    int? SessionDurationMinutes = null,

    /// <summary>Total number of sessions</summary>
    int? TotalSessions = null,

    // ========================================
    // LOCATION
    // ========================================

    /// <summary>Location type: remote, in_person, or both</summary>
    string? LocationType = null,

    /// <summary>Street address</summary>
    string? LocationAddress = null,

    /// <summary>City name</summary>
    string? LocationCity = null,

    /// <summary>Postal code</summary>
    string? LocationPostalCode = null,

    /// <summary>Country code (ISO 3166-1 alpha-2)</summary>
    string? LocationCountry = null,

    /// <summary>Maximum distance in km for in-person meetings</summary>
    int? MaxDistanceKm = null)
    : IVersionedContract
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}