using Core.Common.Exceptions;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using NotificationService.Application.Commands.Chat;
using NotificationService.Domain.Repositories;

namespace NotificationService.Application.CommandHandlers.Chat;

/// <summary>
/// Handler for marking messages as read
/// </summary>
public class MarkMessagesAsReadCommandHandler(
    INotificationUnitOfWork unitOfWork,
    ILogger<MarkMessagesAsReadCommandHandler> logger)
    : BaseCommandHandler<MarkMessagesAsReadCommand, bool>(logger)
{
    private readonly INotificationUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<bool>> Handle(
        MarkMessagesAsReadCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var thread = await _unitOfWork.ChatThreads
                .GetByThreadIdAsync(request.ThreadId, cancellationToken);

            if (thread == null)
            {
                throw new ResourceNotFoundException("ChatThread", request.ThreadId);
            }

            if (!thread.IsParticipant(request.UserId))
            {
                return Error("You are not a participant of this chat", ErrorCodes.InsufficientPermissions);
            }

            if (!string.IsNullOrEmpty(request.MessageId))
            {
                // Mark single message as read
                await _unitOfWork.ChatMessages.MarkAsReadAsync(request.MessageId, cancellationToken);
            }
            else
            {
                // Mark all messages as read
                var beforeTimestamp = request.BeforeTimestamp ?? DateTime.UtcNow;
                await _unitOfWork.ChatMessages.MarkAllAsReadAsync(
                    request.ThreadId, request.UserId, beforeTimestamp, cancellationToken);

                // Reset unread count in thread
                thread.MarkAsRead(request.UserId);
                await _unitOfWork.ChatThreads.UpdateAsync(thread, cancellationToken);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            Logger.LogDebug(
                "Marked messages as read in thread {ThreadId} for user {UserId}",
                request.ThreadId, request.UserId);

            return Success(true, "Messages marked as read");
        }
        catch (ResourceNotFoundException)
        {
            throw;
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error marking messages as read in thread {ThreadId}", request.ThreadId);
            return Error("An error occurred while marking messages as read", ErrorCodes.InternalError);
        }
    }
}
