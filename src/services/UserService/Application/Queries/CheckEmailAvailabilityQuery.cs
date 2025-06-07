using CQRS.Interfaces;
using FluentValidation;

namespace UserService.Application.Queries;

// ============================================================================
// CHECK EMAIL AVAILABILITY QUERY
// ============================================================================

public record CheckEmailAvailabilityQuery(
    string Email)
    : IQuery<EmailAvailabilityResponse>, ICacheableQuery
{
    public string CacheKey => $"email-availability:{Email}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(2);
}

public record EmailAvailabilityResponse(
    string Email,
    bool IsAvailable,
    string? Suggestion);

public class CheckEmailAvailabilityQueryValidator : AbstractValidator<CheckEmailAvailabilityQuery>
{
    public CheckEmailAvailabilityQueryValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format");
    }
}