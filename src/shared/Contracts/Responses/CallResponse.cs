namespace Contracts.Responses;

public record CallResponse(
    Guid CallId,
    string CallStatus);
