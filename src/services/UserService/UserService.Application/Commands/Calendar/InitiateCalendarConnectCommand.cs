using CQRS.Models;
using MediatR;

namespace UserService.Application.Commands.Calendar;

/// <summary>
/// Response containing the OAuth authorization URL
/// </summary>
public record InitiateCalendarConnectResponse
{
    public string AuthorizationUrl { get; init; } = string.Empty;
    public string State { get; init; } = string.Empty;
}

/// <summary>
/// Command to initiate calendar connection - generates OAuth URL for the provider
/// </summary>
public record InitiateCalendarConnectCommand(
    string UserId,
    string Provider,
    string RedirectUri) : IRequest<ApiResponse<InitiateCalendarConnectResponse>>;
