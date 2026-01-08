using CQRS.Models;
using MediatR;

namespace UserService.Application.Commands.LinkedIn;

/// <summary>
/// Command to disconnect LinkedIn account and optionally remove imported data
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public record DisconnectLinkedInCommand(
    string UserId,
    bool RemoveImportedData = false) : IRequest<ApiResponse<bool>>;
