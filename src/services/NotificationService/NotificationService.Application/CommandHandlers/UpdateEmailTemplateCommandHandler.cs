using Contracts.Notification.Responses;
using Microsoft.Extensions.Logging;
using CQRS.Handlers;
using CQRS.Models;
using NotificationService.Application.Commands;
using NotificationService.Domain.Repositories;
using System.Text.Json;
using Core.Common.Exceptions;

namespace NotificationService.Application.CommandHandlers;

public class UpdateEmailTemplateCommandHandler(
    INotificationUnitOfWork unitOfWork,
    ILogger<UpdateEmailTemplateCommandHandler> logger)
    : BaseCommandHandler<UpdateEmailTemplateCommand, UpdateEmailTemplateResponse>(logger)
{
    private readonly INotificationUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<UpdateEmailTemplateResponse>> Handle(
        UpdateEmailTemplateCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var template = await _unitOfWork.EmailTemplates
                .GetByIdAsync(request.TemplateId, cancellationToken);

            if (template == null || template.IsDeleted)
            {
                throw new System.InvalidOperationException("Template not found");
            }

            // Update fields if provided
            if (!string.IsNullOrEmpty(request.Subject))
                template.Subject = request.Subject;

            if (!string.IsNullOrEmpty(request.HtmlContent))
                template.HtmlContent = request.HtmlContent;

            if (!string.IsNullOrEmpty(request.TextContent))
                template.TextContent = request.TextContent;

            if (!string.IsNullOrEmpty(request.Description))
                template.Description = request.Description;

            if (request.IsActive.HasValue)
                template.IsActive = request.IsActive.Value;

            if (request.VariablesSchema != null)
                template.VariablesSchema = JsonSerializer.Serialize(request.VariablesSchema);

            template.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.EmailTemplates.UpdateAsync(template, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            Logger.LogInformation("Email template {TemplateId} ({TemplateName}) updated by user {UserId}",
                request.TemplateId, template.Name, request.UserId);

            return Success(new UpdateEmailTemplateResponse(
                request.TemplateId,
                template.Name,
                template.UpdatedAt.Value));
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error updating email template {TemplateId}", request.TemplateId);
            return Error("Error updating email template: " + ex.Message, ErrorCodes.InternalError);
        }
    }
}
