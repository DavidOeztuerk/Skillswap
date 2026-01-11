namespace Contracts.User.Responses.LinkedIn;

/// <summary>
/// Response for LinkedIn connection details
/// </summary>
public record LinkedInConnectionResponse(
    string Id,
    string LinkedInId,
    string? ProfileUrl,
    string? LinkedInEmail,
    bool IsVerified,
    DateTime? VerifiedAt,
    DateTime? LastSyncAt,
    int ImportedExperienceCount,
    int ImportedEducationCount,
    bool AutoSyncEnabled,
    DateTime CreatedAt);
