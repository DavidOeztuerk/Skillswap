using Contracts.Notification.Responses;
using Microsoft.Extensions.Logging;
using CQRS.Handlers;
using CQRS.Models;
using NotificationService.Application.Commands;
using NotificationService.Domain.Entities;
using NotificationService.Domain.Repositories;
using System.Text.Json;

namespace NotificationService.Application.CommandHandlers;

public class SendNotificationCommandHandler(
    INotificationUnitOfWork unitOfWork,
    ILogger<SendNotificationCommandHandler> logger)
    : BaseCommandHandler<SendNotificationCommand, SendNotificationResponse>(logger)
{
    private readonly INotificationUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<SendNotificationResponse>> Handle(
        SendNotificationCommand request,
        CancellationToken cancellationToken)
    {
        var notificationId = Guid.NewGuid().ToString();

        var metadata = new NotificationMetadata
        {
            Variables = request.Variables,
            CorrelationId = request.CorrelationId,
            SourceEvent = "Manual",
            ExpiresAt = request.ScheduledAt?.AddDays(7)
        };

        // Note: Subject and Content are intentionally left empty
        // so that NotificationOrchestrator loads the template from the database
        // via EmailService.SendTemplatedEmailAsync (see orchestrator line 51-67)
        var notification = new Notification
        {
            Id = notificationId,
            UserId = request.UserId ?? "system",
            Type = request.Type,
            Template = request.Template,
            Recipient = request.Recipient,
            Subject = string.Empty, // Will be loaded from template
            Content = string.Empty, // Will be loaded from template
            Status = request.ScheduledAt.HasValue && request.ScheduledAt > DateTime.UtcNow
                ? NotificationStatus.Pending
                : NotificationStatus.Pending,
            Priority = request.Priority,
            MetadataJson = JsonSerializer.Serialize(metadata),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Notifications.AddAsync(notification, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Log creation event
        var notificationEvent = new NotificationEvent
        {
            NotificationId = notificationId,
            EventType = NotificationEventTypes.Queued,
            Details = $"Notification queued for {request.Type} delivery",
            Timestamp = DateTime.UtcNow
        };

        await _unitOfWork.NotificationEvents.CreateAsync(notificationEvent, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        Logger.LogInformation("Notification {NotificationId} created and queued for delivery", notificationId);

        var response = new SendNotificationResponse(
            notificationId,
            notification.CreatedAt);

        return Success(response);
    }
}
