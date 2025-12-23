using Contracts.Notification.Responses;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using CQRS.Handlers;
using CQRS.Models;
using NotificationService.Application.Commands;
using NotificationService.Domain.Entities;
using NotificationService.Domain.Repositories;
using System.Text.Json;
using Core.Common.Exceptions;

namespace NotificationService.Application.CommandHandlers;

public class CreateEmailTemplateCommandHandler(
    INotificationUnitOfWork unitOfWork,
    ILogger<CreateEmailTemplateCommandHandler> logger)
    : BaseCommandHandler<CreateEmailTemplateCommand, CreateEmailTemplateResponse>(logger)
{
    private readonly INotificationUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<CreateEmailTemplateResponse>> Handle(
        CreateEmailTemplateCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Check if template with same name and language already exists
            var existingTemplate = await _unitOfWork.EmailTemplates
                .GetByNameAsync(request.Name, cancellationToken);

            if (existingTemplate != null && existingTemplate.Language == request.Language)
            {
                return Error($"Template '{request.Name}' already exists for language '{request.Language}'", ErrorCodes.ResourceAlreadyExists);
            }

            var templateId = Guid.NewGuid().ToString();
            var template = new EmailTemplate
            {
                Id = templateId,
                Name = request.Name,
                Language = request.Language,
                Subject = request.Subject,
                HtmlContent = request.HtmlContent,
                TextContent = request.TextContent,
                Description = request.Description,
                IsActive = true,
                Version = "1.0",
                VariablesSchema = request.VariablesSchema != null
                    ? JsonSerializer.Serialize(request.VariablesSchema)
                    : null,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _unitOfWork.EmailTemplates.CreateAsync(template, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            Logger.LogInformation("Email template {TemplateName} created for language {Language} by user {UserId}",
                request.Name, request.Language, request.UserId);

            var response = new CreateEmailTemplateResponse(
                templateId,
                request.Name,
                request.Language,
                template.CreatedAt);

            return Success(response);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error creating email template {TemplateName} for language {Language}",
                request.Name, request.Language);
            return Error("An error occurred while creating the email template.", ErrorCodes.InternalError);
        }
    }
}
