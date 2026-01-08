using CQRS.Models;
using MediatR;

namespace UserService.Application.Commands.Xing;

/// <summary>
/// Response after completing Xing connection
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public record XingConnectionResponse
{
    public string Id { get; init; } = string.Empty;
    public string XingId { get; init; } = string.Empty;
    public string? ProfileUrl { get; init; }
    public string? XingEmail { get; init; }
    public bool IsVerified { get; init; }
    public DateTime? VerifiedAt { get; init; }
    public DateTime? LastSyncAt { get; init; }
    public int ImportedExperienceCount { get; init; }
    public int ImportedEducationCount { get; init; }
    public bool AutoSyncEnabled { get; init; }
    public DateTime CreatedAt { get; init; }
}

/// <summary>
/// Command to complete Xing connection - exchanges OAuth 1.0a verifier for tokens
/// Phase 12: LinkedIn/Xing Integration
/// Note: OAuth 1.0a uses oauth_verifier instead of code
/// </summary>
public record CompleteXingConnectCommand(
    string OAuthToken,
    string OAuthVerifier,
    string State) : IRequest<ApiResponse<XingConnectionResponse>>;
