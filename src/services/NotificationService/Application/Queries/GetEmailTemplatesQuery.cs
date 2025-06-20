// ============================================================================
// QUERIES
// ============================================================================

using CQRS.Interfaces;
using FluentValidation;
using NotificationService.Domain.ResponseModels;

namespace NotificationService.Application.Queries;

public record GetEmailTemplatesQuery(
    string? Language = null,
    bool? IsActive = null,
    int Page = 1,
    int PageSize = 20)
    : IPagedQuery<EmailTemplateResponse>
{
    public int PageNumber { get; set; } = Page;
    public int PageSize { get; set; } = PageSize;
}

public class GetEmailTemplatesQueryValidator : AbstractValidator<GetEmailTemplatesQuery>
{
    public GetEmailTemplatesQueryValidator()
    {
        RuleFor(x => x.Page)
            .GreaterThan(0).WithMessage("Page must be greater than 0");

        RuleFor(x => x.PageSize)
            .GreaterThan(0).WithMessage("PageSize must be greater than 0")
            .LessThanOrEqualTo(100).WithMessage("PageSize must not exceed 100");

        RuleFor(x => x.Language)
            .Length(2, 10).WithMessage("Language must be 2-10 characters")
            .When(x => !string.IsNullOrEmpty(x.Language));
    }
}