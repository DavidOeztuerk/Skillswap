using CQRS.Interfaces;
using FluentValidation;
using NotificationService.Domain.ResponseModels;

namespace NotificationService.Application.Queries;

public record GetNotificationStatisticsQuery(
    DateTime? StartDate = null,
    DateTime? EndDate = null,
    string? Type = null,
    string? Template = null) : IQuery<NotificationStatisticsResponse>;

public class GetNotificationStatisticsQueryValidator : AbstractValidator<GetNotificationStatisticsQuery>
{
    public GetNotificationStatisticsQueryValidator()
    {
        RuleFor(x => x.StartDate)
            .LessThan(x => x.EndDate)
            .When(x => x.StartDate.HasValue && x.EndDate.HasValue)
            .WithMessage("StartDate must be before EndDate");

        RuleFor(x => x.EndDate)
            .LessThanOrEqualTo(DateTime.UtcNow)
            .When(x => x.EndDate.HasValue)
            .WithMessage("EndDate cannot be in the future");
    }
}