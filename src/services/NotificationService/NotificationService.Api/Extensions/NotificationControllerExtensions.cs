using System.Security.Claims;
using Contracts.Notification.Requests;
using Contracts.Notification.Responses;
using CQRS.Extensions;
using CQRS.Models;
using Infrastructure.Extensions;
using Infrastructure.Security;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using NotificationService.Application.Commands;
using NotificationService.Application.Queries;
using NotificationService.Domain.ResponseModels;
using EmailTemplateDetailResponse = NotificationService.Domain.ResponseModels.EmailTemplateDetailResponse;
using TemplatePreviewResponse = NotificationService.Domain.ResponseModels.TemplatePreviewResponse;
using SendTestEmailResponse = NotificationService.Domain.ResponseModels.SendTestEmailResponse;
using ReminderSettingsResponse = NotificationService.Domain.ResponseModels.ReminderSettingsResponse;

namespace NotificationService.Extensions;

public static class NotificationControllerExtensions
{
    public static RouteGroupBuilder MapNotificationController(this IEndpointRouteBuilder builder)
    {
        RouteGroupBuilder notifications = builder.MapGroup("/notifications").WithTags("Notifications");

        notifications.MapGet("/", async (IMediator mediator, ClaimsPrincipal claims, [AsParameters] GetNotificationHistoryRequest request) =>
        {
            var userId = claims.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetNotificationHistoryQuery(userId, request.Type, request.Status, request.StartDate, request.EndDate, request.PageNumber, request.PageSize);
            return await mediator.SendQuery(query);
        })
        .WithName("GetUserNotifications")
        .WithSummary("Get user notifications")
        .WithDescription("Retrieves all notifications for the authenticated user")
        .RequireAuthorization()
        .Produces<PagedResponse<GetNotificationHistoryQuery>>(200);

        notifications.MapPost("/read-all", async (IMediator mediator, ClaimsPrincipal claims) =>
        {
            var userId = claims.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new MarkAllNotificationsAsReadCommand(userId);
            return await mediator.SendCommand(command);
        })
        .WithName("MarkAllNotificationsAsRead")
        .WithSummary("Mark all notifications as read")
        .WithDescription("Marks all notifications as read for the authenticated user")
        .RequireAuthorization()
        .Produces<MarkAllNotificationsAsReadResponse>(200);

        notifications.MapPost("/send", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] SendNotificationRequest request) =>
        {
            var userId = claims.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new SendNotificationCommand(request.Type, request.Template, request.Recipient, request.Variables, request.Priority, request.ScheduledAt, request.CorrelationId) { UserId = userId };
            return await mediator.SendCommand(command);
        })
        .WithName("SendNotification")
        .WithSummary("Send a notification")
        .WithDescription("Sends a single notification via email, SMS, or push")
        .RequireAuthorization()
        .Produces<SendNotificationResponse>(200)
        .Produces(400);

        notifications.MapPost("/bulk", handler: async (IMediator mediator, ClaimsPrincipal claims, [FromBody] SendBulkNotificationRequest request) =>
        {
            var userId = claims.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new SendBulkNotificationCommand(request.UserIds, request.Type, request.Template, request.GlobalVariables, request.UserSpecificVariables, request.Priority, request.ScheduledAt) { UserId = userId };
            return await mediator.SendCommand(command);
        })
        .WithName("SendBulkNotification")
        .WithSummary("Send bulk notifications")
        .WithDescription("Sends notifications to multiple users")
        .RequireAuthorization(Policies.RequireAdminRole)
        .Produces<SendBulkNotificationResponse>(200)
        .Produces(400);

        notifications.MapPost("/cancel", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] CancelNotificationRequest request) =>
        {
            var userId = claims.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new CancelNotificationCommand(request.NotificationId, request.Reason) { UserId = userId };
            return await mediator.SendCommand(command);
        })
        .WithName("CancelNotification")
        .WithSummary("Cancel a notification")
        .WithDescription("Cancels a pending notification")
        .RequireAuthorization()
        .Produces<CancelNotificationResponse>(200);

        notifications.MapPost("/retry", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] RetryFailedNotificationRequest request) =>
        {
            var userId = claims.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new RetryFailedNotificationCommand(request.NotificationId) { UserId = userId };
            return await mediator.SendCommand(command);
        })
        .WithName("RetryNotification")
        .WithSummary("Retry failed notification")
        .WithDescription("Retries a failed notification")
        .RequireAuthorization()
        .Produces<RetryFailedNotificationResponse>(200);

        notifications.MapPost("/{notificationId}/read", async (IMediator mediator, ClaimsPrincipal claims, string notificationId) =>
        {
            var userId = claims.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new MarkNotificationAsReadCommand(notificationId, userId);
            return await mediator.SendCommand(command);
        })
        .WithName("MarkNotificationAsRead")
        .WithSummary("Mark notification as read")
        .WithDescription("Marks a notification as read by the user")
        .RequireAuthorization()
        .Produces<MarkNotificationAsReadResponse>(200);

        notifications.MapDelete("/{notificationId}", async (IMediator mediator, ClaimsPrincipal claims, string notificationId) =>
        {
            var userId = claims.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new DeleteNotificationCommand(notificationId, userId);
            return await mediator.SendCommand(command);
        })
        .WithName("DeleteNotification")
        .WithSummary("Delete a notification")
        .WithDescription("Deletes a notification for the authenticated user")
        .RequireAuthorization()
        .Produces<DeleteNotificationResponse>(200);

        // Grouped endpoints for user preferences
        var preferences = builder.MapGroup("/preferences").WithTags("Preferences");

        preferences.MapGet("/", async (IMediator mediator, ClaimsPrincipal claims) =>
        {
            var userId = claims.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetNotificationPreferencesQuery(userId);
            return await mediator.SendQuery(query);
        })
        .WithName("GetNotificationPreferences")
        .WithSummary("Get user notification preferences")
        .WithDescription("Retrieves the authenticated user's notification preferences")
        .RequireAuthorization()
        .Produces<NotificationPreferencesResponse>(200);

        preferences.MapPut("/", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] UpdateNotificationPreferencesRequest request) =>
        {
            var userId = claims.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new UpdateNotificationPreferencesCommand(userId, request.EmailEnabled, request.EmailMarketing, request.EmailSecurity, request.EmailUpdates, request.SmsEnabled, request.SmsSecurity, request.SmsReminders, request.PushEnabled, request.PushMarketing, request.PushSecurity, request.PushUpdates, request.QuietHoursStart, request.QuietHoursEnd, request.TimeZone, request.DigestFrequency, request.Language);
            return await mediator.SendCommand(command);
        })
        .WithName("UpdateNotificationPreferences")
        .WithSummary("Update notification preferences")
        .WithDescription("Updates the authenticated user's notification preferences")
        .RequireAuthorization()
        .Produces<UpdateNotificationPreferencesResponse>(200);

        preferences.MapPost("/push-token", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] RegisterPushTokenRequest request) =>
        {
            var userId = claims.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new RegisterPushTokenCommand(userId, request.Token);
            return await mediator.SendCommand(command);
        })
        .WithName("RegisterPushToken")
        .WithSummary("Register push notification token")
        .WithDescription("Registers a Firebase Cloud Messaging token for push notifications")
        .RequireAuthorization()
        .Produces<bool>(200);

        // Grouped endpoints for reminder settings
        var reminders = builder.MapGroup("/reminders").WithTags("Reminders");

        reminders.MapGet("/settings", async (IMediator mediator, ClaimsPrincipal claims) =>
        {
            var userId = claims.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetReminderSettingsQuery(userId);
            return await mediator.SendQuery(query);
        })
        .WithName("GetReminderSettings")
        .WithSummary("Get reminder settings")
        .WithDescription("Retrieves the authenticated user's reminder settings")
        .RequireAuthorization()
        .Produces<ReminderSettingsResponse>(200);

        reminders.MapPut("/settings", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] UpdateReminderSettingsRequest request) =>
        {
            var userId = claims.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new UpdateReminderSettingsCommand(
                userId,
                request.ReminderMinutesBefore,
                request.EmailRemindersEnabled,
                request.PushRemindersEnabled,
                request.SmsRemindersEnabled);
            return await mediator.SendCommand(command);
        })
        .WithName("UpdateReminderSettings")
        .WithSummary("Update reminder settings")
        .WithDescription("Updates the authenticated user's reminder settings for appointments")
        .RequireAuthorization()
        .Produces<ReminderSettingsResponse>(200);

        // Grouped endpoints for templates (Admin)
        var templates = builder.MapGroup("/templates").WithTags("Templates");

        templates.MapPost("/", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] CreateEmailTemplateRequest request) =>
        {
            var userId = claims.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new CreateEmailTemplateCommand(request.Name, request.Language, request.Subject, request.HtmlContent, request.TextContent, request.Description, request.VariablesSchema) { UserId = userId };
            return await mediator.SendCommand(command);
        })
        .WithName("CreateEmailTemplate")
        .WithSummary("Create email template (Admin)")
        .WithDescription("Creates a new email template - Admin access required")
        .RequireAuthorization(Policies.RequireAdminRole)
        .Produces<CreateEmailTemplateResponse>(201);

        templates.MapPut("/", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] UpdateEmailTemplateRequest request) =>
        {
            var userId = claims.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new UpdateEmailTemplateCommand(request.TemplateId, request.Subject, request.HtmlContent, request.TextContent, request.Description, null, request.VariablesSchema) { UserId = userId };
            return await mediator.SendCommand(command);
        })
        .WithName("UpdateEmailTemplate")
        .WithSummary("Update email template (Admin)")
        .WithDescription("Updates an existing email template - Admin access required")
        .RequireAuthorization(Policies.RequireAdminRole)
        .Produces<UpdateEmailTemplateResponse>(200);

        templates.MapGet("/", async (IMediator mediator, ClaimsPrincipal claims, [AsParameters] GetEmailTemplatesRequest request) =>
        {
            var userId = claims.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetEmailTemplatesQuery(request.Language, request.IsActive, request.PageNumber, request.PageSize);
            return await mediator.SendQuery(query);
        })
        .WithName("GetEmailTemplates")
        .WithSummary("Get email templates (Admin)")
        .WithDescription("Retrieves all email templates - Admin access required")
        .RequireAuthorization(Policies.RequireAdminRole)
        .Produces<PagedResponse<EmailTemplateResponse>>(200);

        templates.MapGet("/{templateId}", async (IMediator mediator, ClaimsPrincipal claims, string templateId) =>
        {
            var userId = claims.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetTemplateByIdQuery(templateId);
            return await mediator.SendQuery(query);
        })
        .WithName("GetTemplateById")
        .WithSummary("Get email template by ID (Admin)")
        .WithDescription("Retrieves a specific email template with full content - Admin access required")
        .RequireAuthorization(Policies.RequireAdminRole)
        .Produces<EmailTemplateDetailResponse>(200);

        templates.MapPost("/preview", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] PreviewTemplateRequest request) =>
        {
            var userId = claims.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new PreviewTemplateCommand(request.TemplateId, request.Variables) { UserId = userId };
            return await mediator.SendCommand(command);
        })
        .WithName("PreviewTemplate")
        .WithSummary("Preview email template (Admin)")
        .WithDescription("Renders an email template with sample or provided variables - Admin access required")
        .RequireAuthorization(Policies.RequireAdminRole)
        .Produces<TemplatePreviewResponse>(200);

        templates.MapPost("/test-send", async (IMediator mediator, ClaimsPrincipal claims, [FromBody] SendTestEmailRequest request) =>
        {
            var userId = claims.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var command = new SendTestEmailCommand(request.TemplateId, request.RecipientEmail, request.Variables) { UserId = userId };
            return await mediator.SendCommand(command);
        })
        .WithName("SendTestEmail")
        .WithSummary("Send test email (Admin)")
        .WithDescription("Sends a test email using the specified template - Admin access required")
        .RequireAuthorization(Policies.RequireAdminRole)
        .Produces<SendTestEmailResponse>(200);

        // Grouped endpoints for analytics (Admin)
        var analytics = builder.MapGroup("/analytics").WithTags("Analytics");

        analytics.MapGet("/statistics", async (IMediator mediator, ClaimsPrincipal claims, [AsParameters] GetNotificationStatisticsRequest request) =>
        {
            var userId = claims.GetUserId();
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var query = new GetNotificationStatisticsQuery(request.StartDate, request.EndDate, request.Type, request.Template);
            return await mediator.SendQuery(query);
        })
        .WithName("GetNotificationStatistics")
        .WithSummary("Get notification statistics (Admin)")
        .WithDescription("Retrieves comprehensive notification statistics - Admin access required")
        .RequireAuthorization(Policies.RequireAdminRole)
        .Produces<NotificationStatisticsResponse>(200);

        return notifications;
    }
}