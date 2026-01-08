using CQRS.Models;
using MediatR;

namespace UserService.Application.Commands.LinkedIn;

/// <summary>
/// Response after completing LinkedIn connection
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public record LinkedInConnectionResponse
{
    public string Id { get; init; } = string.Empty;
    public string LinkedInId { get; init; } = string.Empty;
    public string? ProfileUrl { get; init; }
    public string? LinkedInEmail { get; init; }
    public bool IsVerified { get; init; }
    public DateTime? VerifiedAt { get; init; }
    public DateTime? LastSyncAt { get; init; }
    public int ImportedExperienceCount { get; init; }
    public int ImportedEducationCount { get; init; }
    public bool AutoSyncEnabled { get; init; }
    public DateTime CreatedAt { get; init; }
}

/// <summary>
/// Command to complete LinkedIn connection - exchanges OAuth 2.0 code for tokens
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public record CompleteLinkedInConnectCommand(
    string Code,
    string State,
    string RedirectUri) : IRequest<ApiResponse<LinkedInConnectionResponse>>;
