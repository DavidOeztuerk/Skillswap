// ============================================================================
// QUERIES
// ============================================================================

using CQRS.Interfaces;
using FluentValidation;
using NotificationService.Domain.ResponseModels;

namespace NotificationService.Application.Queries;

public record GetNotificationPreferencesQuery(
    string UserId) : IQuery<NotificationPreferencesResponse>;

public class GetNotificationPreferencesQueryValidator : AbstractValidator<GetNotificationPreferencesQuery>
{
    public GetNotificationPreferencesQueryValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");
    }
}
