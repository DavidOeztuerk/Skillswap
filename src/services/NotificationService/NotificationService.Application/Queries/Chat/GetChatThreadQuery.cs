using Contracts.Chat.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace NotificationService.Application.Queries.Chat;

/// <summary>
/// Query to get a single chat thread by ThreadId
/// </summary>
public record GetChatThreadQuery(
    string UserId,
    string ThreadId) : IQuery<ChatThreadResponse>, ICacheableQuery
{
    public string CacheKey => $"chat-thread:{ThreadId}";
    public TimeSpan CacheDuration => TimeSpan.FromSeconds(30);
}

public class GetChatThreadQueryValidator : AbstractValidator<GetChatThreadQuery>
{
    public GetChatThreadQueryValidator()
    {
        RuleFor(x => x.UserId)
            .NotEmpty().WithMessage("User ID is required");

        RuleFor(x => x.ThreadId)
            .NotEmpty().WithMessage("Thread ID is required");
    }
}
