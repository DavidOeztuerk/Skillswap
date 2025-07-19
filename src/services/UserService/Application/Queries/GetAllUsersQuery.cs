using CQRS.Interfaces;
using FluentValidation;

namespace UserService.Application.Queries;

public record GetAllUsersQuery(
    string? SearchTerm = null,
    string? Role = null,
    string? AccountStatus = null,
    bool? EmailVerified = null,
    DateTime? CreatedAfter = null,
    DateTime? CreatedBefore = null,
    int PageNumber = 1,
    int PageSize = 20)
    : IPagedQuery<UserAdminResponse>
{
    public int PageNumber { get; set; } = PageNumber;
    public int PageSize { get; set; } = PageSize;
}

public record UserAdminResponse(
    string UserId,
    string Email,
    string FirstName,
    string LastName,
    string UserName,
    List<string> Roles,
    bool EmailVerified,
    string AccountStatus,
    DateTime CreatedAt,
    DateTime? LastLoginAt,
    string? LastLoginIp,
    int FailedLoginAttempts,
    bool IsAccountLocked,
    DateTime? AccountLockedUntil);

public class GetAllUsersQueryValidator : AbstractValidator<GetAllUsersQuery>
{
    public GetAllUsersQueryValidator()
    {
        RuleFor(x => x.SearchTerm)
            .MaximumLength(100).WithMessage("Search term must not exceed 100 characters")
            .When(x => !string.IsNullOrEmpty(x.SearchTerm));
        
        RuleFor(x => x.PageNumber)
            .GreaterThan(0).WithMessage("Page number must be greater than 0");
        
        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100).WithMessage("Page size must be between 1 and 100");
    }
}
