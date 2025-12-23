using Contracts.Chat.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace NotificationService.Application.Queries.Chat;

/// <summary>
/// Query to get messages for a chat thread
/// </summary>
public record GetChatMessagesQuery(
    string UserId,
    string ThreadId,
    string? AfterMessageId = null,
    DateTime? AfterTimestamp = null,
    string? SearchTerm = null,
    string? MessageType = null,
    string? Context = null,
    string? ContextReferenceId = null,
    int PageNumber = 1,
    int PageSize = 50) : IPagedQuery<ChatMessageResponse>, ICacheableQuery
{
    int IPagedQuery<ChatMessageResponse>.PageNumber { get; set; } = PageNumber;
    int IPagedQuery<ChatMessageResponse>.PageSize { get; set; } = PageSize;

    public string CacheKey => $"chat-messages:{ThreadId}:{PageNumber}:{PageSize}";
    public TimeSpan CacheDuration => TimeSpan.FromSeconds(10);
}

public class GetChatMessagesQueryValidator : AbstractValidator<GetChatMessagesQuery>
{
    public GetChatMessagesQueryValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");

        RuleFor(x => x.ThreadId)
            .NotEmpty().WithMessage("Thread ID is required");

        RuleFor(x => x.PageNumber)
            .GreaterThan(0).WithMessage("PageNumber must be greater than 0");

        RuleFor(x => x.PageSize)
            .GreaterThan(0).WithMessage("PageSize must be greater than 0")
            .LessThanOrEqualTo(100).WithMessage("PageSize must not exceed 100");
    }
}
