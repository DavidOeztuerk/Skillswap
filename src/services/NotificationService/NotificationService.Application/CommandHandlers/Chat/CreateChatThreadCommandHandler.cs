using Contracts.Chat.Responses;
using Core.Common.Exceptions;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using NotificationService.Application.Commands.Chat;
using NotificationService.Domain.Entities;
using NotificationService.Domain.Repositories;

namespace NotificationService.Application.CommandHandlers.Chat;

/// <summary>
/// Handler for creating chat threads
/// </summary>
public class CreateChatThreadCommandHandler(
    INotificationUnitOfWork unitOfWork,
    ILogger<CreateChatThreadCommandHandler> logger)
    : BaseCommandHandler<CreateChatThreadCommand, ChatThreadResponse>(logger)
{
    private readonly INotificationUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<ChatThreadResponse>> Handle(
        CreateChatThreadCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Check if thread already exists
            var existingThread = await _unitOfWork.ChatThreads
                .GetByThreadIdAsync(request.ThreadId, cancellationToken);

            if (existingThread != null)
            {
                Logger.LogInformation(
                    "Chat thread {ThreadId} already exists, returning existing",
                    request.ThreadId);

                // Return existing thread (idempotent)
                return Success(
                    MapToResponse(existingThread, request.Participant1Id),
                    "Chat thread already exists");
            }

            // Create new thread
            var thread = new ChatThread
            {
                ThreadId = request.ThreadId,
                Participant1Id = request.Participant1Id,
                Participant2Id = request.Participant2Id,
                Participant1Name = request.Participant1Name,
                Participant2Name = request.Participant2Name,
                Participant1AvatarUrl = request.Participant1AvatarUrl,
                Participant2AvatarUrl = request.Participant2AvatarUrl,
                SkillId = request.SkillId,
                SkillName = request.SkillName,
                MatchId = request.MatchId
            };

            await _unitOfWork.ChatThreads.AddAsync(thread, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            Logger.LogInformation(
                "Created chat thread {ThreadId} for match {MatchId}",
                request.ThreadId, request.MatchId);

            var response = MapToResponse(thread, request.Participant1Id);
            return Success(response, "Chat thread created successfully");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error creating chat thread {ThreadId}", request.ThreadId);
            return Error("An error occurred while creating the chat thread", ErrorCodes.InternalError);
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
