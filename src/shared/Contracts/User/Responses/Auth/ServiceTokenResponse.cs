namespace Contracts.User.Responses.Auth;

public record ServiceTokenResponse(
    string AccessToken,
    int ExpiresIn,
    string ServiceName
);
