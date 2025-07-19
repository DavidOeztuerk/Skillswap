using CQRS.Interfaces;
using FluentValidation;

namespace UserService.Application.Queries;

// ============================================================================
// GET USER BY EMAIL QUERY
// ============================================================================

public record GetUserByEmailQuery(
    string Email)
    : IQuery<UserSummaryResponse?>, ICacheableQuery
{
    public string CacheKey => $"user-email:{Email}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(5);
}

public record UserSummaryResponse(
    string UserId,
    string Email,
    string FirstName,
    string LastName,
    string UserName,
    List<string> Roles,
    bool EmailVerified,
    string AccountStatus);

public class GetUserByEmailQueryValidator : AbstractValidator<GetUserByEmailQuery>
{
    public GetUserByEmailQueryValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format");
    }
}
