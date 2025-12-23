using Contracts.Chat.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace NotificationService.Application.Queries.Chat;

/// <summary>
/// Query to get all chat threads for a user
/// </summary>
public record GetChatThreadsQuery(
    string UserId,
    string? SearchTerm = null,
    bool UnreadOnly = false,
    int PageNumber = 1,
    int PageSize = 20) : IPagedQuery<ChatThreadResponse>, ICacheableQuery
{
    int IPagedQuery<ChatThreadResponse>.PageNumber { get; set; } = PageNumber;
    int IPagedQuery<ChatThreadResponse>.PageSize { get; set; } = PageSize;

    public string CacheKey => $"chat-threads:{UserId}:{PageNumber}:{PageSize}:{UnreadOnly}";
    public TimeSpan CacheDuration => TimeSpan.FromSeconds(30);
}

public class GetChatThreadsQueryValidator : AbstractValidator<GetChatThreadsQuery>
{
    public GetChatThreadsQueryValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");

        RuleFor(x => x.PageNumber)
            .GreaterThan(0).WithMessage("PageNumber must be greater than 0");

        RuleFor(x => x.PageSize)
            .GreaterThan(0).WithMessage("PageSize must be greater than 0")
            .LessThanOrEqualTo(50).WithMessage("PageSize must not exceed 50");
    }
}
