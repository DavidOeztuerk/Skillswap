namespace Contracts.User.Responses.LinkedIn;

/// <summary>
/// Result of syncing profile data from LinkedIn or Xing
/// Phase 12: LinkedIn/Xing Integration
/// </summary>
public record ProfileSyncResultResponse(
    int ExperiencesImported,
    int ExperiencesUpdated,
    int EducationsImported,
    int EducationsUpdated,
    DateTime SyncedAt,
    string? Error = null)
{
    public bool Success => string.IsNullOrEmpty(Error);
}
