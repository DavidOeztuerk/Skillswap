using Contracts.User.Responses.LinkedIn;
using CQRS.Interfaces;

namespace UserService.Application.Commands.Xing;

/// <summary>
/// Command to sync profile data from Xing (experiences and educations)
/// </summary>
public record SyncXingProfileCommand : ICommand<ProfileSyncResultResponse>, IAuditableCommand, ICacheInvalidatingCommand
{
  public string? UserId { get; set; }
  public DateTime Timestamp { get; set; } = DateTime.UtcNow;

  public string[] InvalidationPatterns =>
  [
      $"user-profile:{UserId}:*",
        $"user-experience:{UserId}:*",
        $"user-education:{UserId}:*",
        $"xing-connection:{UserId}:*",
        $"social-connections:{UserId}"
  ];
}
