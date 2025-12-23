using Microsoft.Extensions.Logging;
using CQRS.Handlers;
using CQRS.Models;
using NotificationService.Application.Commands;
using NotificationService.Domain.ResponseModels;
using NotificationService.Domain.Repositories;
using NotificationService.Domain.Services;
using Core.Common.Exceptions;
using System.Text.Json;

namespace NotificationService.Application.CommandHandlers;

public class SendTestEmailCommandHandler(
    INotificationUnitOfWork unitOfWork,
    ITemplateEngine templateEngine,
    IEmailService emailService,
    ILogger<SendTestEmailCommandHandler> logger)
    : BaseCommandHandler<SendTestEmailCommand, SendTestEmailResponse>(logger)
{
    private readonly INotificationUnitOfWork _unitOfWork = unitOfWork;
    private readonly ITemplateEngine _templateEngine = templateEngine;
    private readonly IEmailService _emailService = emailService;

    public override async Task<ApiResponse<SendTestEmailResponse>> Handle(
        SendTestEmailCommand request,
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

            // Get variables - use provided or generate sample data from schema
            var variables = request.Variables ?? GenerateSampleVariables(template.VariablesSchema);

            // Render the template
            var renderedSubject = $"[TEST] {_templateEngine.RenderTemplate(template.Subject, variables)}";
            var renderedHtml = _templateEngine.RenderTemplate(template.HtmlContent, variables);
            var renderedText = _templateEngine.RenderTemplate(template.TextContent, variables);

            // Send the test email
            var success = await _emailService.SendEmailAsync(
                request.RecipientEmail,
                renderedSubject,
                renderedHtml,
                renderedText);

            if (!success)
            {
                Logger.LogWarning("Failed to send test email for template {TemplateId} to {Email}",
                    request.TemplateId, request.RecipientEmail);

                return Success(new SendTestEmailResponse
                {
                    Success = false,
                    Message = "Failed to send test email. Please check SMTP configuration.",
                    RecipientEmail = request.RecipientEmail
                });
            }

            Logger.LogInformation("Test email sent for template {TemplateId} to {Email} by user {UserId}",
                request.TemplateId, request.RecipientEmail, request.UserId);

            return Success(new SendTestEmailResponse
            {
                Success = true,
                Message = "Test email sent successfully",
                RecipientEmail = request.RecipientEmail
            });
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error sending test email for template {TemplateId}", request.TemplateId);
            return Error("An error occurred while sending the test email", ErrorCodes.InternalError);
        }
    }

    private Dictionary<string, string> GenerateSampleVariables(string? variablesSchema)
    {
        var sampleData = new Dictionary<string, string>();

        if (string.IsNullOrEmpty(variablesSchema))
        {
            return sampleData;
        }

        try
        {
            var schema = JsonSerializer.Deserialize<Dictionary<string, string>>(variablesSchema);
            if (schema == null) return sampleData;

            foreach (var kvp in schema)
            {
                sampleData[kvp.Key] = kvp.Value switch
                {
                    "string" => GetSampleStringValue(kvp.Key),
                    "number" => "30",
                    _ => $"[{kvp.Key}]"
                };
            }
        }
        catch (JsonException)
        {
            Logger.LogWarning("Could not parse variables schema: {Schema}", variablesSchema);
        }

        return sampleData;
    }

    private static string GetSampleStringValue(string key)
    {
        return key.ToLowerInvariant() switch
        {
            "firstname" or "recipientfirstname" => "Max",
            "lastname" or "recipientlastname" => "Mustermann",
            "partnername" or "rescheduledbyname" => "Lisa Schmidt",
            "skillname" => "C# Programming",
            "email" or "recipientemail" => "max.mustermann@example.com",
            "verificationurl" or "reseturl" => "https://skillswap.app/verify/abc123",
            "appurl" => "https://skillswap.app",
            "meetinglink" => "https://skillswap.app/meeting/xyz789",
            "scheduleddate" or "oldscheduleddate" or "newscheduleddate" => "15. Januar 2025",
            "scheduledtime" or "oldscheduledtime" or "newscheduledtime" => "14:00 Uhr",
            "reason" => "Terminkonflikt",
            _ => $"[{key}]"
        };
    }
}
