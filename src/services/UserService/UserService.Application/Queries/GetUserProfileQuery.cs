using FluentValidation;
using CQRS.Interfaces;
using Contracts.User.Responses;

namespace UserService.Application.Queries;

public record GetUserProfileQuery(
    string UserId)
    : IQuery<UserProfileResponse>, ICacheableQuery
{
    public string CacheKey => $"user-profile:{UserId}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(5); // Reduced from 15 to 5 minutes
}

public class GetUserProfileQueryValidator : AbstractValidator<GetUserProfileQuery>
{
    public GetUserProfileQueryValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");
    }
}
