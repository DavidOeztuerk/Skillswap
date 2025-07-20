using FluentValidation;
using CQRS.Interfaces;
using Contracts.User.Responses;

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

public class GetUserProfileQueryValidator : AbstractValidator<GetUserProfileQuery>
{
    public GetUserProfileQueryValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");
    }
}
