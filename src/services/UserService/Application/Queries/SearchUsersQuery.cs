using CQRS.Interfaces;
using FluentValidation;

namespace UserService.Application.Queries;

// ============================================================================
// SEARCH USERS QUERY (Admin/Moderator only)
// ============================================================================

public record SearchUsersQuery(
    string? SearchTerm = null,
    bool? IsAvailable = null,
    decimal? MinRating = null,
    string? SortBy = "CreatedAt",
    bool SortDescending = true,
    bool? EmailVerified = null,
    string? Role = null,
    string? AccountStatus = null,
    DateTime? CreatedAfter = null,
    DateTime? CreatedBefore = null,
    int PageNumber = 1,
    int PageSize = 20)
    : IPagedQuery<UserSearchResultResponse>
{
    public int PageNumber { get; set; } = PageNumber;
    public int PageSize { get; set; } = PageSize;
}

public record UserSearchResultResponse(
    string UserId,
    string Email,
    string FirstName,
    string LastName,
    List<string> Roles,
    bool EmailVerified,
    string AccountStatus,
    DateTime CreatedAt,
    DateTime? LastLoginAt);

public class SearchUsersQueryValidator : AbstractValidator<SearchUsersQuery>
{
    public SearchUsersQueryValidator()
    {
        RuleFor(x => x.SearchTerm)
            .MaximumLength(100).WithMessage("Search term must not exceed 100 characters")
            .When(x => !string.IsNullOrEmpty(x.SearchTerm));

        RuleFor(x => x.PageNumber)
            .GreaterThan(0).WithMessage("Page number must be greater than 0");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100).WithMessage("Page size must be between 1 and 100");

        RuleFor(x => x.Role)
            .MaximumLength(50).WithMessage("Role must not exceed 50 characters")
            .When(x => !string.IsNullOrEmpty(x.Role));

        RuleFor(x => x.AccountStatus)
            .Must(BeValidAccountStatus).WithMessage("Invalid account status")
            .When(x => !string.IsNullOrEmpty(x.AccountStatus));

        RuleFor(x => x.CreatedAfter)
            .LessThan(x => x.CreatedBefore).WithMessage("CreatedAfter must be before CreatedBefore")
            .When(x => x.CreatedAfter.HasValue && x.CreatedBefore.HasValue);
    }

    private static bool BeValidAccountStatus(string? status)
    {
        if (string.IsNullOrEmpty(status)) return true;

        var validStatuses = new[] { "Active", "Inactive", "Suspended", "PendingVerification" };
        return validStatuses.Contains(status, StringComparer.OrdinalIgnoreCase);
    }
}
