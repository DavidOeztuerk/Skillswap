namespace Contracts.User.Responses.Xing;

/// <summary>
/// Response for Xing connection details
/// </summary>
public record XingConnectionResponse(
    string Id,
    string XingId,
    string? ProfileUrl,
    string? XingEmail,
    bool IsVerified,
    DateTime? VerifiedAt,
    DateTime? LastSyncAt,
    int ImportedExperienceCount,
    int ImportedEducationCount,
    bool AutoSyncEnabled,
    DateTime CreatedAt);
