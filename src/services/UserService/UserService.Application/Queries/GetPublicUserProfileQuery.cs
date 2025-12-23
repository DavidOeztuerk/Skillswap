using CQRS.Interfaces;
using FluentValidation;
using Contracts.User.Responses;

namespace UserService.Api.Application.Queries;

public record GetPublicUserProfileQuery(
    string UserId,
    string RequestingUserId)
    : IQuery<PublicUserProfileResponse>, ICacheableQuery
{
    public string CacheKey => $"public-profile:{UserId}:{RequestingUserId}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(5); // Reduced from 15 to 5 minutes
}

public class GetPublicUserProfileQueryValidator : AbstractValidator<GetPublicUserProfileQuery>
{
    public GetPublicUserProfileQueryValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");

        RuleFor(x => x.RequestingUserId)
            .NotEmpty().WithMessage("Requesting user ID is required");
    }
}
