namespace Events.Notification;

public record BulkNotificationEvent(
    string UserId,
    string Title,
    string Message,
    string Type,
    DateTime SentAt);
