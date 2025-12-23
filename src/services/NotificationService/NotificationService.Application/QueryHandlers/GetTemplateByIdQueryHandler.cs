using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using NotificationService.Application.Queries;
using NotificationService.Domain.ResponseModels;
using NotificationService.Domain.Repositories;
using Core.Common.Exceptions;

namespace NotificationService.Application.QueryHandlers;

public class GetTemplateByIdQueryHandler(
    INotificationUnitOfWork unitOfWork,
    ILogger<GetTemplateByIdQueryHandler> logger)
    : BaseQueryHandler<GetTemplateByIdQuery, EmailTemplateDetailResponse>(logger)
{
    private readonly INotificationUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<EmailTemplateDetailResponse>> Handle(
        GetTemplateByIdQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var template = await _unitOfWork.EmailTemplates
                .GetByIdAsync(request.TemplateId, cancellationToken);

            if (template == null)
            {
                return Error("Template not found", ErrorCodes.ResourceNotFound);
            }

            var response = new EmailTemplateDetailResponse
            {
                Id = template.Id,
                Name = template.Name,
                Language = template.Language,
                Subject = template.Subject,
                HtmlContent = template.HtmlContent,
                TextContent = template.TextContent,
                Description = template.Description,
                VariablesSchema = template.VariablesSchema,
                IsActive = template.IsActive,
                Version = template.Version,
                CreatedAt = template.CreatedAt,
                UpdatedAt = template.UpdatedAt ?? DateTime.UtcNow
            };

            return Success(response);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error retrieving template {TemplateId}", request.TemplateId);
            return Error("An error occurred while retrieving the template", ErrorCodes.InternalError);
        }
    }
}
