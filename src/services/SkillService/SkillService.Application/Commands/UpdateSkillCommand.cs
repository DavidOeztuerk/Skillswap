using Contracts.Skill.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace SkillService.Application.Commands;

public record UpdateSkillCommand(
    string SkillId,
    string Name,
    string Description,
    string CategoryId,
    List<string> Tags,
    bool IsOffered,
    int? AvailableHours = null,
    int? PreferredSessionDuration = 60,
    bool? IsActive = null,
    // ========================================
    // EXCHANGE OPTIONS
    // ========================================
    string? ExchangeType = null,
    string? DesiredSkillCategoryId = null,
    string? DesiredSkillDescription = null,
    decimal? HourlyRate = null,
    string? Currency = null,
    // ========================================
    // SCHEDULING
    // ========================================
    List<string>? PreferredDays = null,
    List<string>? PreferredTimes = null,
    int? SessionDurationMinutes = null,
    int? TotalSessions = null,
    // ========================================
    // LOCATION
    // ========================================
    string? LocationType = null,
    string? LocationAddress = null,
    string? LocationCity = null,
    string? LocationPostalCode = null,
    string? LocationCountry = null,
    int? MaxDistanceKm = null)
    : ICommand<UpdateSkillResponse>, IAuditableCommand, ICacheInvalidatingCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // ICacheInvalidatingCommand implementation
    // Invalidate specific skill cache and all search caches
    public string[] InvalidationPatterns => new[]
    {
        "skills-search:*",
        "user-skills:*",
        "skill-details:*"
    };
}

public class UpdateSkillCommandValidator : AbstractValidator<UpdateSkillCommand>
{
    public UpdateSkillCommandValidator()
    {
        RuleFor(x => x.SkillId)
            .NotEmpty().WithMessage("Skill ID is required");

        RuleFor(x => x.Name)
            .Length(3, 100).WithMessage("Skill name must be between 3 and 100 characters")
            .When(x => !string.IsNullOrEmpty(x.Name));

        RuleFor(x => x.Description)
            .Length(10, 2000).WithMessage("Description must be between 10 and 2000 characters")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.Tags)
            .Must(tags => tags == null || tags.Count <= 10)
            .WithMessage("Maximum 10 tags allowed")
            .When(x => x.Tags != null);

        RuleFor(x => x.AvailableHours)
            .GreaterThan(0).WithMessage("Duration must be greater than 0")
            .LessThanOrEqualTo(480).WithMessage("Duration cannot exceed 8 hours")
            .When(x => x.AvailableHours.HasValue);

        // Exchange validation
        RuleFor(x => x.HourlyRate)
            .GreaterThanOrEqualTo(5).WithMessage("Hourly rate must be at least 5")
            .When(x => x.ExchangeType == "payment" && x.HourlyRate.HasValue);

        RuleFor(x => x.Currency)
            .Must(c => new[] { "EUR", "USD", "CHF", "GBP" }.Contains(c))
            .WithMessage("Currency must be EUR, USD, CHF, or GBP")
            .When(x => !string.IsNullOrEmpty(x.Currency));

        // Scheduling validation
        RuleFor(x => x.SessionDurationMinutes)
            .InclusiveBetween(15, 480).WithMessage("Session duration must be between 15 and 480 minutes")
            .When(x => x.SessionDurationMinutes.HasValue);

        RuleFor(x => x.TotalSessions)
            .InclusiveBetween(1, 100).WithMessage("Total sessions must be between 1 and 100")
            .When(x => x.TotalSessions.HasValue);

        // Location validation
        RuleFor(x => x.LocationType)
            .Must(lt => new[] { "remote", "in_person", "both" }.Contains(lt))
            .WithMessage("Location type must be remote, in_person, or both")
            .When(x => !string.IsNullOrEmpty(x.LocationType));

        RuleFor(x => x.MaxDistanceKm)
            .InclusiveBetween(1, 500).WithMessage("Max distance must be between 1 and 500 km")
            .When(x => x.MaxDistanceKm.HasValue);
    }
}