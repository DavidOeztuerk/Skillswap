using CQRS.Interfaces;
using FluentValidation;

namespace UserService.Application.Queries;

public record GetPublicUserProfileQuery(
    string UserId,
    string RequestingUserId)
    : IQuery<PublicUserProfileResponse>, ICacheableQuery
{
    public string CacheKey => $"public-profile:{UserId}:{RequestingUserId}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(15);
}

public record PublicUserProfileResponse(
    string UserId,
    string FirstName,
    string LastName,
    string? Bio,
    string? AvatarUrl,
    DateTime MemberSince,
    int SkillsOffered,
    int SkillsLearned,
    double AverageRating,
    int TotalReviews,
    bool IsBlocked,
    List<string> Languages,
    string? TimeZone);

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
