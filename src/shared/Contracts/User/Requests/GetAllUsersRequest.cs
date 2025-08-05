using System.ComponentModel.DataAnnotations;

namespace Contracts.User.Requests;

/// <summary>
/// API request for GetAllUsers operation
/// </summary>
public record GetAllUsersRequest(
    int PageNumber = 1,
    int PageSize = 20,
    string? SortBy = "UserName",
    bool SortDescending = false)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
