using FluentValidation;
using CQRS.Interfaces;

namespace UserService.Application.Queries;

// ============================================================================
// GET USER PROFILE QUERY
// ============================================================================

public record GetUserProfileQuery(
    string UserId)
    : IQuery<UserProfileResponse>, ICacheableQuery
{
    public string CacheKey => $"user-profile:{UserId}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(15);
}

public record UserProfileResponse(
    string UserId,
    string Email,
    string FirstName,
    string LastName,
    string UserName,
    string? PhoneNumber,
    string? Bio,
    string? TimeZone,
    List<string> Roles,
    bool EmailVerified,
    string AccountStatus,
    DateTime CreatedAt,
    DateTime? LastLoginAt,
    Dictionary<string, string>? Preferences);

public class GetUserProfileQueryValidator : AbstractValidator<GetUserProfileQuery>
{
    public GetUserProfileQueryValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");
    }
}
