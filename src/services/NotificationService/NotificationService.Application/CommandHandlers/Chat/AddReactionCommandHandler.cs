using Core.Common.Exceptions;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using NotificationService.Application.Commands.Chat;
using NotificationService.Domain.Repositories;

namespace NotificationService.Application.CommandHandlers.Chat;

/// <summary>
/// Handler for adding or removing reactions to messages
/// </summary>
public class AddReactionCommandHandler(
    INotificationUnitOfWork unitOfWork,
    ILogger<AddReactionCommandHandler> logger)
    : BaseCommandHandler<AddReactionCommand, bool>(logger)
{
    private readonly INotificationUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<bool>> Handle(
        AddReactionCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            var message = await _unitOfWork.ChatMessages
                .GetByIdAsync(request.MessageId, cancellationToken);

            if (message == null)
            {
                throw new ResourceNotFoundException("ChatMessage", request.MessageId);
            }

            // Verify user has access to the thread
            var thread = await _unitOfWork.ChatThreads
                .GetByThreadIdAsync(message.ThreadId, cancellationToken);

            if (thread == null || !thread.IsParticipant(request.UserId))
            {
                return Error("You are not a participant of this chat", ErrorCodes.InsufficientPermissions);
            }

            if (request.Remove)
            {
                await _unitOfWork.ChatMessages.RemoveReactionAsync(
                    request.MessageId, request.UserId, request.Emoji, cancellationToken);
            }
            else
            {
                await _unitOfWork.ChatMessages.AddReactionAsync(
                    request.MessageId, request.UserId, request.Emoji, cancellationToken);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            Logger.LogDebug(
                "{Action} reaction {Emoji} on message {MessageId} by user {UserId}",
                request.Remove ? "Removed" : "Added",
                request.Emoji, request.MessageId, request.UserId);

            return Success(true, request.Remove ? "Reaction removed" : "Reaction added");
        }
        catch (ResourceNotFoundException)
        {
            throw;
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error handling reaction on message {MessageId}", request.MessageId);
            return Error("An error occurred while handling the reaction", ErrorCodes.InternalError);
        }
    }
}
