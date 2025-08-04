using FluentValidation;
using CQRS.Interfaces;
using Contracts.User.Responses;

namespace UserService.Api.Application.Queries;

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
