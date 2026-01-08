using System.ComponentModel.DataAnnotations;
using Domain.Abstractions;

namespace UserService.Domain.Models;

/// <summary>
/// Denormalized user statistics for performance (Phase 5)
/// Pre-calculated values updated on relevant events
/// </summary>
public class UserStatistics : AuditableEntity
{
    [Required]
    [MaxLength(450)]
    public string UserId { get; set; } = string.Empty;

    // =============================================
    // Experience Statistics
    // =============================================

    /// <summary>
    /// Total months of professional experience (calculated from UserExperience)
    /// </summary>
    public int TotalExperienceMonths { get; set; } = 0;

    /// <summary>
    /// Total years of experience (computed from months, rounded down)
    /// </summary>
    public int TotalExperienceYears => TotalExperienceMonths / 12;

    /// <summary>
    /// Number of experience entries
    /// </summary>
    public int ExperienceCount { get; set; } = 0;

    /// <summary>
    /// Primary job title (most recent or longest)
    /// </summary>
    [MaxLength(200)]
    public string? PrimaryJobTitle { get; set; }

    /// <summary>
    /// Primary industry/field based on experience
    /// </summary>
    [MaxLength(200)]
    public string? PrimaryIndustry { get; set; }

    // =============================================
    // Skill Statistics
    // =============================================

    /// <summary>
    /// Number of skills offered by user
    /// </summary>
    public int SkillsOfferedCount { get; set; } = 0;

    /// <summary>
    /// Number of skills user wants to learn
    /// </summary>
    public int SkillsWantedCount { get; set; } = 0;

    /// <summary>
    /// Total endorsements received on all skills
    /// </summary>
    public int TotalEndorsementsReceived { get; set; } = 0;

    // =============================================
    // Match & Session Statistics
    // =============================================

    /// <summary>
    /// Total matches completed
    /// </summary>
    public int MatchesCompletedCount { get; set; } = 0;

    /// <summary>
    /// Total sessions completed
    /// </summary>
    public int SessionsCompletedCount { get; set; } = 0;

    /// <summary>
    /// Total hours spent in sessions
    /// </summary>
    public decimal TotalSessionHours { get; set; } = 0;

    // =============================================
    // Review Statistics
    // =============================================

    /// <summary>
    /// Average rating received (1-5)
    /// </summary>
    public double? AverageRating { get; set; }

    /// <summary>
    /// Total number of reviews received
    /// </summary>
    public int ReviewsReceivedCount { get; set; } = 0;

    /// <summary>
    /// Total number of reviews given
    /// </summary>
    public int ReviewsGivenCount { get; set; } = 0;

    // =============================================
    // Activity Statistics
    // =============================================

    /// <summary>
    /// Date user joined
    /// </summary>
    public DateTime MemberSince { get; set; }

    /// <summary>
    /// Last time user was active on the platform
    /// </summary>
    public DateTime? LastActiveAt { get; set; }

    /// <summary>
    /// Total profile views
    /// </summary>
    public int ProfileViewCount { get; set; } = 0;

    /// <summary>
    /// When statistics were last recalculated
    /// </summary>
    public DateTime LastCalculatedAt { get; set; } = DateTime.UtcNow;

    // =============================================
    // Navigation
    // =============================================

    public virtual User User { get; set; } = null!;

    // =============================================
    // Factory & Helper Methods
    // =============================================

    public static UserStatistics CreateForUser(string userId, DateTime memberSince)
    {
        return new UserStatistics
        {
            UserId = userId,
            MemberSince = memberSince,
            LastCalculatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Recalculate experience from UserExperience entries
    /// </summary>
    public void RecalculateExperience(IEnumerable<UserExperience> experiences)
    {
        var experienceList = experiences.ToList();
        ExperienceCount = experienceList.Count;

        if (experienceList.Count == 0)
        {
            TotalExperienceMonths = 0;
            PrimaryJobTitle = null;
            return;
        }

        // Calculate total months (handling overlapping periods)
        var totalMonths = 0;
        foreach (var exp in experienceList)
        {
            var endDate = exp.EndDate ?? DateTime.UtcNow;
            var months = ((endDate.Year - exp.StartDate.Year) * 12) + endDate.Month - exp.StartDate.Month;
            totalMonths += Math.Max(0, months);
        }
        TotalExperienceMonths = totalMonths;

        // Set primary job title (most recent or current)
        var currentOrMostRecent = experienceList
            .OrderByDescending(e => e.EndDate == null ? DateTime.MaxValue : e.EndDate.Value)
            .ThenByDescending(e => e.StartDate)
            .FirstOrDefault();

        PrimaryJobTitle = currentOrMostRecent?.Title;
        LastCalculatedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Update skill counts
    /// </summary>
    public void UpdateSkillCounts(int offered, int wanted, int endorsements)
    {
        SkillsOfferedCount = offered;
        SkillsWantedCount = wanted;
        TotalEndorsementsReceived = endorsements;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Update match/session statistics
    /// </summary>
    public void UpdateMatchStats(int matchesCompleted, int sessionsCompleted, decimal totalHours)
    {
        MatchesCompletedCount = matchesCompleted;
        SessionsCompletedCount = sessionsCompleted;
        TotalSessionHours = totalHours;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Update review statistics
    /// </summary>
    public void UpdateReviewStats(double? avgRating, int reviewsReceived, int reviewsGiven)
    {
        AverageRating = avgRating;
        ReviewsReceivedCount = reviewsReceived;
        ReviewsGivenCount = reviewsGiven;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Record a profile view
    /// </summary>
    public void RecordProfileView()
    {
        ProfileViewCount++;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Update last active timestamp
    /// </summary>
    public void UpdateLastActive()
    {
        LastActiveAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }
}
