using Contracts.User.Responses.LinkedIn;
using CQRS.Interfaces;

namespace UserService.Application.Commands.LinkedIn;

/// <summary>
/// Command to sync profile data from LinkedIn (experiences and educations)
/// </summary>
public record SyncLinkedInProfileCommand : ICommand<ProfileSyncResultResponse>, IAuditableCommand, ICacheInvalidatingCommand
{
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    public string[] InvalidationPatterns =>
    [
        $"user-profile:{UserId}:*",
        $"user-experience:{UserId}:*",
        $"user-education:{UserId}:*",
        $"linkedin-connection:{UserId}:*",
        $"social-connections:{UserId}"
    ];
}
