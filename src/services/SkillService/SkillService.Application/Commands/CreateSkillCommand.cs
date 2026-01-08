using CQRS.Interfaces;
using FluentValidation;
using Contracts.Skill.Responses;

namespace SkillService.Application.Commands;

public record CreateSkillCommand(
    string Name,
    string Description,
    string CategoryId,
    List<string> Tags,
    bool IsOffered,
    int? AvailableHours = null,
    int? PreferredSessionDuration = 60,

    // Exchange options (optional, default: skill_exchange)
    string? ExchangeType = "skill_exchange",
    string? DesiredSkillCategoryId = null,
    string? DesiredSkillDescription = null,
    decimal? HourlyRate = null,
    string? Currency = null,

    // Scheduling (required for matching)
    List<string>? PreferredDays = null,
    List<string>? PreferredTimes = null,
    int SessionDurationMinutes = 60,
    int TotalSessions = 1,

    // Location (optional, default: remote)
    string? LocationType = "remote",
    string? LocationAddress = null,
    string? LocationCity = null,
    string? LocationPostalCode = null,
    string? LocationCountry = null,
    int MaxDistanceKm = 50)
    : ICommand<CreateSkillResponse>, IAuditableCommand, ICacheInvalidatingCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // ICacheInvalidatingCommand implementation
    // Invalidate all skill-related caches when a new skill is created
    public string[] InvalidationPatterns =>
    [
        "skills-search:*",  // All search queries
        "user-skills:*",    // All user skill lists
        "skill-categories:*" // Category statistics might change
    ];
}

public class CreateSkillCommandValidator : AbstractValidator<CreateSkillCommand>
{
    private static readonly string[] ValidExchangeTypes = ["skill_exchange", "payment"];
    private static readonly string[] ValidLocationTypes = ["remote", "in_person", "both"];
    private static readonly string[] ValidCurrencies = ["EUR", "USD", "CHF", "GBP"];
    private static readonly int[] ValidSessionDurations = [15, 30, 45, 60, 90, 120];
    private static readonly string[] ValidDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    private static readonly string[] ValidTimes = ["morning", "afternoon", "evening"];

    public CreateSkillCommandValidator()
    {
        // Basic fields
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Skill name is required")
            .Length(3, 100).WithMessage("Skill name must be between 3 and 100 characters")
            .Matches(@"^[a-zA-Z0-9\s\-\.\+\#äöüÄÖÜß]+$").WithMessage("Skill name contains invalid characters");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Description is required")
            .Length(10, 2000).WithMessage("Description must be between 10 and 2000 characters");

        RuleFor(x => x.CategoryId)
            .NotEmpty().WithMessage("Skill category is required");

        RuleFor(x => x.Tags)
            .Must(tags => tags == null || tags.Count <= 10)
            .WithMessage("Maximum 10 tags allowed")
            .Must(tags => tags == null || tags.All(tag => tag.Length <= 50))
            .WithMessage("Each tag must be 50 characters or less");

        // Exchange validation
        RuleFor(x => x.ExchangeType)
            .Must(type => string.IsNullOrEmpty(type) || ValidExchangeTypes.Contains(type.ToLowerInvariant()))
            .WithMessage("Exchange type must be 'skill_exchange' or 'payment'");

        // Payment only allowed when IsOffered=true
        RuleFor(x => x.ExchangeType)
            .Must((cmd, type) => type?.ToLowerInvariant() != "payment" || cmd.IsOffered)
            .WithMessage("Payment exchange type is only allowed when offering a skill (IsOffered=true)");

        RuleFor(x => x.HourlyRate)
            .GreaterThanOrEqualTo(5).WithMessage("Hourly rate must be at least 5 EUR")
            .LessThanOrEqualTo(500).WithMessage("Hourly rate cannot exceed 500 EUR")
            .When(x => x.ExchangeType?.ToLowerInvariant() == "payment");

        RuleFor(x => x.Currency)
            .Must(c => string.IsNullOrEmpty(c) || ValidCurrencies.Contains(c.ToUpperInvariant()))
            .WithMessage("Currency must be EUR, USD, CHF, or GBP");

        RuleFor(x => x.DesiredSkillDescription)
            .MaximumLength(500).WithMessage("Desired skill description cannot exceed 500 characters");

        // Scheduling validation
        RuleFor(x => x.SessionDurationMinutes)
            .Must(d => ValidSessionDurations.Contains(d))
            .WithMessage("Session duration must be 15, 30, 45, 60, 90, or 120 minutes");

        RuleFor(x => x.TotalSessions)
            .GreaterThanOrEqualTo(1).WithMessage("At least 1 session required")
            .LessThanOrEqualTo(50).WithMessage("Maximum 50 sessions allowed");

        RuleFor(x => x.PreferredDays)
            .Must(days => days == null || days.All(d => ValidDays.Contains(d.ToLowerInvariant())))
            .WithMessage("Invalid day in preferred days");

        RuleFor(x => x.PreferredTimes)
            .Must(times => times == null || times.All(t => ValidTimes.Contains(t.ToLowerInvariant())))
            .WithMessage("Invalid time in preferred times (use morning, afternoon, evening)");

        // Location validation
        RuleFor(x => x.LocationType)
            .Must(type => string.IsNullOrEmpty(type) || ValidLocationTypes.Contains(type.ToLowerInvariant()))
            .WithMessage("Location type must be 'remote', 'in_person', or 'both'");

        RuleFor(x => x.LocationCity)
            .MaximumLength(100).WithMessage("City name cannot exceed 100 characters");

        RuleFor(x => x.LocationPostalCode)
            .MaximumLength(20).WithMessage("Postal code cannot exceed 20 characters");

        RuleFor(x => x.LocationCountry)
            .MaximumLength(2).WithMessage("Country must be 2-letter ISO code (e.g., DE)")
            .Matches(@"^[A-Za-z]{2}$").WithMessage("Country must be 2-letter ISO code")
            .When(x => !string.IsNullOrEmpty(x.LocationCountry));

        RuleFor(x => x.MaxDistanceKm)
            .GreaterThanOrEqualTo(1).WithMessage("Max distance must be at least 1 km")
            .LessThanOrEqualTo(500).WithMessage("Max distance cannot exceed 500 km");

        // Location required for in_person
        RuleFor(x => x.LocationCity)
            .NotEmpty().WithMessage("City is required for in-person skills")
            .When(x => x.LocationType?.ToLowerInvariant() is "in_person" or "both");

        RuleFor(x => x.LocationCountry)
            .NotEmpty().WithMessage("Country is required for in-person skills")
            .When(x => x.LocationType?.ToLowerInvariant() is "in_person" or "both");

        // Legacy fields
        RuleFor(x => x.AvailableHours)
            .GreaterThan(0).WithMessage("Duration must be greater than 0")
            .LessThanOrEqualTo(480).WithMessage("Duration cannot exceed 8 hours")
            .When(x => x.AvailableHours.HasValue);

        RuleFor(x => x.PreferredSessionDuration)
            .GreaterThan(0).WithMessage("Session duration must be greater than 0")
            .LessThanOrEqualTo(480).WithMessage("Session duration cannot exceed 8 hours")
            .When(x => x.PreferredSessionDuration.HasValue);
    }
}
