using CQRS.Interfaces;
using FluentValidation;

namespace UserService.Api.Application.Queries;

public record GetUserRolesQuery(
    string UserId)
    : IQuery<UserRolesResponse>, ICacheableQuery
{
    public string CacheKey => $"user-roles:{UserId}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(10);
}

public record UserRolesResponse(
    string UserId,
    List<string> Roles,
    List<string> Permissions);

public class GetUserRolesQueryValidator : AbstractValidator<GetUserRolesQuery>
{
    public GetUserRolesQueryValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");
    }
}
