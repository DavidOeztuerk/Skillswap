using Contracts.VideoCall.Responses;
using Core.Common.Exceptions;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using VideocallService.Application.Queries;
using VideocallService.Domain.Repositories;

namespace VideocallService.Application.QueryHandlers;

/// <summary>
/// Handler for retrieving chat history from a video call session
/// </summary>
public class GetChatHistoryQueryHandler(
    IChatMessageRepository chatMessageRepository,
    ILogger<GetChatHistoryQueryHandler> logger)
    : BaseQueryHandler<GetChatHistoryQuery, List<ChatMessageResponse>>(logger)
{
    private readonly IChatMessageRepository _chatMessageRepository = chatMessageRepository;

    public override async Task<ApiResponse<List<ChatMessageResponse>>> Handle(
        GetChatHistoryQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            Logger.LogInformation("📖 [GetChatHistory] Fetching chat history for session {SessionId} (limit: {Limit})",
                request.SessionId, request.Limit);

            // Get messages (recent if limit specified, all if not)
            var messages = request.Limit.HasValue
                ? await _chatMessageRepository.GetRecentMessagesAsync(
                    request.SessionId,
                    request.Limit.Value,
                    cancellationToken)
                : await _chatMessageRepository.GetMessagesBySessionIdAsync(
                    request.SessionId,
                    cancellationToken);

            // Map to response
            var response = messages.Select(m => new ChatMessageResponse(
                m.Id,
                m.SessionId,
                m.SenderId,
                m.SenderName,
                m.Message,
                m.SentAt,
                m.MessageType,
                m.Metadata
            )).ToList();

            Logger.LogInformation("✅ [GetChatHistory] Retrieved {Count} messages for session {SessionId}",
                response.Count, request.SessionId);

            return Success(response, $"Retrieved {response.Count} messages");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "❌ [GetChatHistory] Error fetching chat history for session {SessionId}",
                request.SessionId);
            return Error("Failed to retrieve chat history", ErrorCodes.InternalError);
        }
    }
}
