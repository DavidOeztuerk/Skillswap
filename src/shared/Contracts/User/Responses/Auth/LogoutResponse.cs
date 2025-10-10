namespace Contracts.User.Responses.Auth;

public record LogoutResponse(
    bool Success,
    string Message
);
