using Contracts.Chat.Responses;
using Core.Common.Exceptions;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using NotificationService.Application.Queries.Chat;
using NotificationService.Domain.Entities;
using NotificationService.Domain.Repositories;

namespace NotificationService.Application.QueryHandlers.Chat;

/// <summary>
/// Handler for getting chat threads for a user
/// </summary>
public class GetChatThreadsQueryHandler(
    INotificationUnitOfWork unitOfWork,
    ILogger<GetChatThreadsQueryHandler> logger)
    : BasePagedQueryHandler<GetChatThreadsQuery, ChatThreadResponse>(logger)
{
    private readonly INotificationUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<PagedResponse<ChatThreadResponse>> Handle(
        GetChatThreadsQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            List<ChatThread> threads;
            int totalCount;

            if (request.UnreadOnly)
            {
                // Use paginated unread query
                threads = await _unitOfWork.ChatThreads
                    .GetWithUnreadMessagesPagedAsync(request.UserId, request.PageNumber, request.PageSize, cancellationToken);
                totalCount = await _unitOfWork.ChatThreads
                    .GetWithUnreadMessagesCountAsync(request.UserId, cancellationToken);
            }
            else if (!string.IsNullOrEmpty(request.SearchTerm))
            {
                threads = await _unitOfWork.ChatThreads
                    .SearchAsync(request.UserId, request.SearchTerm, request.PageNumber, request.PageSize, cancellationToken);
                totalCount = await _unitOfWork.ChatThreads
                    .GetSearchCountAsync(request.UserId, request.SearchTerm, cancellationToken);
            }
            else
            {
                threads = await _unitOfWork.ChatThreads
                    .GetByUserIdAsync(request.UserId, request.PageNumber, request.PageSize, cancellationToken);
                totalCount = await _unitOfWork.ChatThreads
                    .GetCountByUserIdAsync(request.UserId, cancellationToken);
            }

            var responses = threads.Select(t => MapToResponse(t, request.UserId)).ToList();

            return Success(responses, request.PageNumber, request.PageSize, totalCount);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error retrieving chat threads for user {UserId}", request.UserId);
            return Error("An error occurred while retrieving chat threads", ErrorCodes.InternalError);
        }
    }

    private static ChatThreadResponse MapToResponse(ChatThread thread, string currentUserId)
    {
        var isParticipant1 = thread.Participant1Id == currentUserId;

        return new ChatThreadResponse
        {
            Id = thread.Id,
            ThreadId = thread.ThreadId,
            Participant1Id = thread.Participant1Id,
            Participant2Id = thread.Participant2Id,
            Participant1Name = thread.Participant1Name,
            Participant2Name = thread.Participant2Name,
            Participant1AvatarUrl = thread.Participant1AvatarUrl,
            Participant2AvatarUrl = thread.Participant2AvatarUrl,
            SkillId = thread.SkillId,
            SkillName = thread.SkillName,
            MatchId = thread.MatchId,
            LastMessageAt = thread.LastMessageAt,
            LastMessagePreview = thread.LastMessagePreview,
            LastMessageSenderId = thread.LastMessageSenderId,
            UnreadCount = thread.GetUnreadCount(currentUserId),
            TotalMessageCount = thread.TotalMessageCount,
            IsLocked = thread.IsLocked,
            LockReason = thread.LockReason,
            OtherParticipantIsTyping = isParticipant1
                ? thread.Participant2IsTyping
                : thread.Participant1IsTyping,
            CreatedAt = thread.CreatedAt,
            // Computed fields for convenience
            OtherParticipantId = thread.GetOtherParticipantId(currentUserId),
            OtherParticipantName = thread.GetOtherParticipantName(currentUserId),
            OtherParticipantAvatarUrl = isParticipant1
                ? thread.Participant2AvatarUrl
                : thread.Participant1AvatarUrl
        };
    }
}
