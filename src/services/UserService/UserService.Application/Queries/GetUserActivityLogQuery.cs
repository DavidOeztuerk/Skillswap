using CQRS.Interfaces;
using FluentValidation;

namespace UserService.Application.Queries;

public record GetUserActivityLogQuery(
    string UserId,
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    string? ActivityType = null,
    int PageNumber = 1,
    int PageSize = 50)
    : IPagedQuery<UserActivityResponse>
{
    public int PageNumber { get; set; } = PageNumber;
    public int PageSize { get; set; } = PageSize;
}

public record UserActivityResponse(
    string ActivityId,
    string UserId,
    string ActivityType,
    string Description,
    string? IpAddress,
    string? UserAgent,
    DateTime Timestamp,
    Dictionary<string, object>? Metadata);

public class GetUserActivityLogQueryValidator : AbstractValidator<GetUserActivityLogQuery>
{
    public GetUserActivityLogQueryValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");

        RuleFor(x => x.PageNumber)
            .GreaterThan(0).WithMessage("Page number must be greater than 0");

        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 100).WithMessage("Page size must be between 1 and 100");

        RuleFor(x => x)
            .Must(x => x.FromDate == null || x.ToDate == null || x.FromDate <= x.ToDate)
            .WithMessage("FromDate must be before or equal to ToDate");
    }
}
