using CQRS.Interfaces;
using FluentValidation;

namespace UserService.Application.Queries;

public record GetTwoFactorStatusQuery(
    string UserId)
    : IQuery<TwoFactorStatusResponse>, ICacheableQuery
{
    public string CacheKey => $"2fa-status:{UserId}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(5);
}

public record TwoFactorStatusResponse(
    bool IsEnabled,
    bool HasSecret,
    DateTime? EnabledAt,
    List<string> BackupCodes);

public class GetTwoFactorStatusQueryValidator : AbstractValidator<GetTwoFactorStatusQuery>
{
    public GetTwoFactorStatusQueryValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");
    }
}
