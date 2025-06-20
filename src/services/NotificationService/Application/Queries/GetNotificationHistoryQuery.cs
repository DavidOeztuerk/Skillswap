// ============================================================================
// QUERIES
// ============================================================================

using CQRS.Interfaces;
using FluentValidation;
using NotificationService.Domain.ResponseModels;

namespace NotificationService.Application.Queries;

public record GetNotificationHistoryQuery(
    string UserId,
    string? Type = null,
    string? Status = null,
    DateTime? StartDate = null,
    DateTime? EndDate = null,
    int Page = 1,
    int PageSize = 20) : IPagedQuery<NotificationHistoryResponse>
{
    public int PageNumber { get; set; } = Page;
    public int PageSize { get; set; } = PageSize;
}

public class GetNotificationHistoryQueryValidator : AbstractValidator<GetNotificationHistoryQuery>
{
    public GetNotificationHistoryQueryValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");

        RuleFor(x => x.Page)
            .GreaterThan(0).WithMessage("Page must be greater than 0");

        RuleFor(x => x.PageSize)
            .GreaterThan(0).WithMessage("PageSize must be greater than 0")
            .LessThanOrEqualTo(100).WithMessage("PageSize must not exceed 100");

        RuleFor(x => x.StartDate)
            .LessThan(x => x.EndDate)
            .When(x => x.StartDate.HasValue && x.EndDate.HasValue)
            .WithMessage("StartDate must be before EndDate");
    }
}