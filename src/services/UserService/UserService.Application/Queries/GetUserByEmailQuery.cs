using Contracts.User.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace UserService.Api.Application.Queries;

public record GetUserByEmailQuery(
    string Email)
    : IQuery<UserSummaryResponse>, ICacheableQuery
{
    public string CacheKey => $"user-email:{Email}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(5);
}

public class GetUserByEmailQueryValidator : AbstractValidator<GetUserByEmailQuery>
{
    public GetUserByEmailQueryValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format");
    }
}
