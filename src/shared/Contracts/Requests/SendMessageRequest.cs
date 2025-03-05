namespace Contracts.Requests;

public record SendMessageRequest(
    Guid MatchSessionId,
    string Message);
