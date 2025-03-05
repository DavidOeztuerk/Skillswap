namespace Contracts.Responses;

public record SendMessageResponse(
    Guid MessageId,
    string Message,
    DateTime SentAt);
