using Contracts.Common;

namespace Contracts.User.Responses;

/// <summary>
/// API response containing summary user information for listings
/// </summary>
/// <param name="UserId">Unique identifier for the user</param>
/// <param name="FirstName">User's first name</param>
/// <param name="LastName">User's last name</param>
/// <param name="UserName">User's username</param>
public record UserSummaryResponse(
    string UserId,
    string FirstName,
    string LastName,
    string UserName)
    : IVersionedContract
{
    /// <summary>
    /// API Version this response supports
    /// </summary>
    public string ApiVersion => "v1";
}


// public record UserSummaryResponse(
//     string UserId,
//     string Email,
//     string FirstName,
//     string LastName,
//     string UserName,
//     List<string> Roles,
//     bool EmailVerified,
//     string AccountStatus);