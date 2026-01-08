using CQRS.Models;
using MediatR;

namespace UserService.Application.Commands.Xing;

/// <summary>
/// Command to disconnect Xing account and optionally remove imported data
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public record DisconnectXingCommand(
    string UserId,
    bool RemoveImportedData = false) : IRequest<ApiResponse<bool>>;
