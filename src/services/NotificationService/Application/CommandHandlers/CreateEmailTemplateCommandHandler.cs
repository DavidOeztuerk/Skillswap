using CQRS.Handlers;
using CQRS.Models;
using Microsoft.EntityFrameworkCore;
using NotificationService.Application.Commands;
using NotificationService.Domain.Entities;
using System.Text.Json;

namespace NotificationService.Application.CommandHandlers;

public class CreateEmailTemplateCommandHandler(
    NotificationDbContext context,
    ILogger<CreateEmailTemplateCommandHandler> logger)
    : BaseCommandHandler<CreateEmailTemplateCommand, CreateEmailTemplateResponse>(logger)
{
    private readonly NotificationDbContext _context = context;

    public override async Task<ApiResponse<CreateEmailTemplateResponse>> Handle(
        CreateEmailTemplateCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Check if template with same name and language already exists
            var existingTemplate = await _context.EmailTemplates
                .FirstOrDefaultAsync(t => t.Name == request.Name
                                         && t.Language == request.Language
                                         && !t.IsDeleted, cancellationToken);

            if (existingTemplate != null)
            {
                return Error($"Template '{request.Name}' already exists for language '{request.Language}'");
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

            _context.EmailTemplates.Add(template);
            await _context.SaveChangesAsync(cancellationToken);

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
            return Error("An error occurred while creating the email template.");
        }
    }
}
