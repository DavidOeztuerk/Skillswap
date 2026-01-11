namespace Contracts.User.Responses;

/// <summary>
/// Response for a user's imported skill (professional competency)
/// </summary>
public record UserImportedSkillResponse(
    string Id,
    string Name,
    string Source,
    string? ExternalId,
    int EndorsementCount,
    string? Category,
    int SortOrder,
    bool IsVisible,
    DateTime? ImportedAt,
    DateTime? LastSyncAt,
    DateTime CreatedAt);
