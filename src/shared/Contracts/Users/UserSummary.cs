namespace Contracts.Users;

public record UserSummary(
    string UserId,
    string FullName,
    string? ProfilePictureUrl);
