// ============================================================================
// UPDATE EMAIL TEMPLATE COMMAND HANDLER
// ============================================================================

using CQRS.Handlers;
using Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using NotificationService.Application.Commands;
using NotificationService.Infrastructure.Data;
using System.Text.Json;

namespace NotificationService.Application.CommandHandlers;

public class UpdateEmailTemplateCommandHandler(
    NotificationDbContext context,
    ILogger<UpdateEmailTemplateCommandHandler> logger)
    : BaseCommandHandler<UpdateEmailTemplateCommand, UpdateEmailTemplateResponse>(logger)
{
    private readonly NotificationDbContext _context = context;

    public override async Task<ApiResponse<UpdateEmailTemplateResponse>> Handle(
        UpdateEmailTemplateCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var template = await _context.EmailTemplates
                .FirstOrDefaultAsync(t => t.Id == request.TemplateId && !t.IsDeleted, cancellationToken);

            if (template == null)
            {
                throw new InvalidOperationException("Template not found");
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

            await _context.SaveChangesAsync(cancellationToken);

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
            return Error("Error updating email template: " + ex.Message);
        }
    }
}
