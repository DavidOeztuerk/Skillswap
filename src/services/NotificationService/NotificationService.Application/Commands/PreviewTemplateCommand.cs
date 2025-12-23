using CQRS.Interfaces;
using FluentValidation;
using NotificationService.Domain.ResponseModels;

namespace NotificationService.Application.Commands;

public record PreviewTemplateCommand(
    string TemplateId,
    Dictionary<string, string>? Variables = null)
    : ICommand<TemplatePreviewResponse>
{
    public string? UserId { get; set; }
}

public class PreviewTemplateCommandValidator : AbstractValidator<PreviewTemplateCommand>
{
    public PreviewTemplateCommandValidator()
    {
        RuleFor(x => x.TemplateId)
            .NotEmpty().WithMessage("Template ID is required");
    }
}
