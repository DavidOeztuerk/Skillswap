namespace Contracts.User.Responses;

public record EmailAvailabilityResponse(
    string Email,
    bool IsAvailable,
    string? Suggestion);