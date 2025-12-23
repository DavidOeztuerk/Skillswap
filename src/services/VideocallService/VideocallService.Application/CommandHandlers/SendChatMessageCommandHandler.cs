using CQRS.Handlers;
using CQRS.Models;
using Core.Common.Exceptions;
using Microsoft.Extensions.Logging;
using VideocallService.Application.Commands;
using VideocallService.Domain.Entities;
using VideocallService.Domain.Repositories;

namespace VideocallService.Application.CommandHandlers;

/// <summary>
/// Handler for sending chat messages in video call sessions
/// </summary>
public class SendChatMessageCommandHandler(
    IChatMessageRepository chatMessageRepository,
    IVideocallUnitOfWork unitOfWork,
    ILogger<SendChatMessageCommandHandler> logger)
    : BaseCommandHandler<SendChatMessageCommand, bool>(logger)
{
    private readonly IChatMessageRepository _chatMessageRepository = chatMessageRepository;
    private readonly IVideocallUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<bool>> Handle(
        SendChatMessageCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            Logger.LogInformation("💬 [SendChatMessage] User {SenderId} sending message to session {SessionId}",
                request.SenderId, request.SessionId);

            // Verify session exists
            var session = await _unitOfWork.VideoCallSessions
                .GetByIdAsync(request.SessionId, cancellationToken);

            if (session == null)
            {
                Logger.LogWarning("⚠️ [SendChatMessage] Session {SessionId} not found", request.SessionId);
                return Error("Video call session not found", ErrorCodes.ResourceNotFound);
            }

            // Verify user is part of the session
            if (session.InitiatorUserId != request.SenderId &&
                session.ParticipantUserId != request.SenderId)
            {
                Logger.LogWarning("⚠️ [SendChatMessage] User {SenderId} not authorized for session {SessionId}",
                    request.SenderId, request.SessionId);
                return Error("You are not authorized to send messages in this session",
                    ErrorCodes.InsufficientPermissions);
            }

            // Create chat message
            var chatMessage = new ChatMessage
            {
                SessionId = request.SessionId,
                SenderId = request.SenderId,
                SenderName = request.SenderName,
                Message = request.Message,
                MessageType = request.MessageType,
                Metadata = request.Metadata,
                SentAt = DateTime.UtcNow,
                CreatedBy = request.SenderId
            };

            await _chatMessageRepository.CreateAsync(chatMessage, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            Logger.LogInformation("✅ [SendChatMessage] Message {MessageId} saved to database for session {SessionId}",
                chatMessage.Id, request.SessionId);

            return Success(true, "Message sent successfully");
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "❌ [SendChatMessage] Error sending message for session {SessionId}",
                request.SessionId);
            return Error("Failed to send message", ErrorCodes.InternalError);
        }
    }
}
