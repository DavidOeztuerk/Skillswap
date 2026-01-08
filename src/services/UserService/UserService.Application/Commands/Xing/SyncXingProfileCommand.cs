using CQRS.Models;
using MediatR;
using UserService.Application.Commands.LinkedIn;

namespace UserService.Application.Commands.Xing;

/// <summary>
/// Command to sync profile data from Xing (experiences and educations)
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public record SyncXingProfileCommand(string UserId) : IRequest<ApiResponse<ProfileSyncResultResponse>>;
