namespace Contracts.Requests;

public record SendMessageRequest(
    string MatchSessionId,
    string Message);
