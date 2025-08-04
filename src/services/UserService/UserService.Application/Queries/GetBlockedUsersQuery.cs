using Contracts.User.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace UserService.Api.Application.Queries;

public record GetBlockedUsersQuery(
    string UserId,
    int PageNumber = 1,
    int PageSize = 20)
    : IPagedQuery<GetBlockedUsersResponse>
{
    public int PageNumber { get; set; } = PageNumber;
    public int PageSize { get; set; } = PageSize;
}

public class GetBlockedUsersQueryValidator : AbstractValidator<GetBlockedUsersQuery>
{
    public GetBlockedUsersQueryValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");
        
        RuleFor(x => x.PageNumber)
            .GreaterThan(0).WithMessage("Page number must be greater than 0");
        
        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100).WithMessage("Page size must be between 1 and 100");
    }
}
