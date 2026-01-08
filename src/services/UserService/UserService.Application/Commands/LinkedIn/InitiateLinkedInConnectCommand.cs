using CQRS.Models;
using MediatR;

namespace UserService.Application.Commands.LinkedIn;

/// <summary>
/// Response containing the OAuth 2.0 authorization URL for LinkedIn
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public record InitiateLinkedInConnectResponse
{
    public string AuthorizationUrl { get; init; } = string.Empty;
    public string State { get; init; } = string.Empty;
}

/// <summary>
/// Command to initiate LinkedIn connection - generates OAuth 2.0 URL
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public record InitiateLinkedInConnectCommand(
    string UserId,
    string RedirectUri) : IRequest<ApiResponse<InitiateLinkedInConnectResponse>>;
