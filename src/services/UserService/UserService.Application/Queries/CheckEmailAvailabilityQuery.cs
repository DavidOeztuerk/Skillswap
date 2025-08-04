using Contracts.User.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace UserService.Api.Application.Queries;

public record CheckEmailAvailabilityQuery(
    string Email)
    : IQuery<EmailAvailabilityResponse>, ICacheableQuery
{
    public string CacheKey => $"email-availability:{Email}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(2);
}

public class CheckEmailAvailabilityQueryValidator : AbstractValidator<CheckEmailAvailabilityQuery>
{
    public CheckEmailAvailabilityQueryValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Invalid email format");
    }
}
