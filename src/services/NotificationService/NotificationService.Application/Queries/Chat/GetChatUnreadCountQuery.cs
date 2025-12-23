using Contracts.Chat.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace NotificationService.Application.Queries.Chat;

/// <summary>
/// Query to get unread message counts for a user
/// </summary>
public record GetChatUnreadCountQuery(string UserId) : IQuery<ChatUnreadCountResponse>, ICacheableQuery
{
    public string CacheKey => $"chat-unread:{UserId}";
    public TimeSpan CacheDuration => TimeSpan.FromSeconds(15);
}

public class GetChatUnreadCountQueryValidator : AbstractValidator<GetChatUnreadCountQuery>
{
    public GetChatUnreadCountQueryValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");
    }
}
