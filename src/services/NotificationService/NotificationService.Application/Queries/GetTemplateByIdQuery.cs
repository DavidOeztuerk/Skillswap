using CQRS.Interfaces;
using FluentValidation;
using NotificationService.Domain.ResponseModels;

namespace NotificationService.Application.Queries;

public record GetTemplateByIdQuery(string TemplateId) : IQuery<EmailTemplateDetailResponse>;

public class GetTemplateByIdQueryValidator : AbstractValidator<GetTemplateByIdQuery>
{
    public GetTemplateByIdQueryValidator()
    {
        RuleFor(x => x.TemplateId)
            .NotEmpty().WithMessage("Template ID is required");
    }
}
