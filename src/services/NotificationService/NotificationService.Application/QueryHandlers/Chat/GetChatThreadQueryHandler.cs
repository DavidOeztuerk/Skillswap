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
/// Handler for getting a single chat thread
/// </summary>
public class GetChatThreadQueryHandler(
    INotificationUnitOfWork unitOfWork,
    ILogger<GetChatThreadQueryHandler> logger)
    : BaseQueryHandler<GetChatThreadQuery, ChatThreadResponse>(logger)
{
    private readonly INotificationUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<ChatThreadResponse>> Handle(
        GetChatThreadQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            var thread = await _unitOfWork.ChatThreads
                .GetByThreadIdAsync(request.ThreadId, cancellationToken);

            if (thread == null)
            {
                return NotFound("Chat thread not found");
            }

            if (!thread.IsParticipant(request.UserId))
            {
                return Error("You are not a participant of this chat", ErrorCodes.InsufficientPermissions);
            }

            var response = MapToResponse(thread, request.UserId);
            return Success(response);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error retrieving chat thread {ThreadId}", request.ThreadId);
            return Error("An error occurred while retrieving the chat thread", ErrorCodes.InternalError);
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
            OtherParticipantId = thread.GetOtherParticipantId(currentUserId),
            OtherParticipantName = thread.GetOtherParticipantName(currentUserId),
            OtherParticipantAvatarUrl = isParticipant1
                ? thread.Participant2AvatarUrl
                : thread.Participant1AvatarUrl
        };
    }
}
