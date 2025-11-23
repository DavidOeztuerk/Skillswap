using Contracts.VideoCall.Responses;
using CQRS.Interfaces;

namespace VideocallService.Application.Queries;

/// <summary>
/// Query to get chat history for a video call session
/// </summary>
public record GetChatHistoryQuery(
    string SessionId,
    int? Limit = 50) : IQuery<List<ChatMessageResponse>>, ICacheableQuery
{
    public string CacheKey => $"chat-history:{SessionId}";
    public TimeSpan CacheDuration => TimeSpan.FromSeconds(30);
}
