using CQRS.Models;
using MediatR;

namespace UserService.Application.Commands.LinkedIn;

/// <summary>
/// Result of syncing LinkedIn profile data
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public record ProfileSyncResultResponse
{
    public int ExperiencesImported { get; init; }
    public int ExperiencesUpdated { get; init; }
    public int EducationsImported { get; init; }
    public int EducationsUpdated { get; init; }
    public DateTime SyncedAt { get; init; }
    public string? Error { get; init; }
    public bool Success => string.IsNullOrEmpty(Error);
}

/// <summary>
/// Command to sync profile data from LinkedIn (experiences and educations)
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public record SyncLinkedInProfileCommand(string UserId) : IRequest<ApiResponse<ProfileSyncResultResponse>>;
