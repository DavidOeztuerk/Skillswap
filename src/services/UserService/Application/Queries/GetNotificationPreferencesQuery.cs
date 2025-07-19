using CQRS.Interfaces;
using FluentValidation;

namespace UserService.Application.Queries;

public record GetNotificationPreferencesQuery(
    string UserId)
    : IQuery<NotificationPreferencesResponse>, ICacheableQuery
{
    public string CacheKey => $"notification-prefs:{UserId}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(10);
}

public record NotificationPreferencesResponse(
    string UserId,
    //EmailNotificationSettings EmailSettings,
    //PushNotificationSettings PushSettings,
    //InAppNotificationSettings InAppSettings,
    DateTime? LastUpdated);

public class GetNotificationPreferencesQueryValidator : AbstractValidator<GetNotificationPreferencesQuery>
{
    public GetNotificationPreferencesQueryValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");
    }
}
