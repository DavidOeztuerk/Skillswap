using CQRS.Models;
using MediatR;

namespace UserService.Application.Commands.Xing;

/// <summary>
/// Response containing the OAuth 1.0a authorization URL for Xing
/// Phase 12: LinkedIn/Xing Integration
/// Note: OAuth 1.0a requires a request token before authorization
/// </summary>
public record InitiateXingConnectResponse
{
    public string AuthorizationUrl { get; init; } = string.Empty;
    public string State { get; init; } = string.Empty;
    /// <summary>
    /// OAuth 1.0a request token (needed for callback)
    /// </summary>
    public string RequestToken { get; init; } = string.Empty;
}

/// <summary>
/// Command to initiate Xing connection - generates OAuth 1.0a URL
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public record InitiateXingConnectCommand(
    string UserId,
    string RedirectUri) : IRequest<ApiResponse<InitiateXingConnectResponse>>;
