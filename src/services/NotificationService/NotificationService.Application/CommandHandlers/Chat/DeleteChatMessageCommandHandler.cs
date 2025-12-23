using Core.Common.Exceptions;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using NotificationService.Application.Commands.Chat;
using NotificationService.Domain.Repositories;

namespace NotificationService.Application.CommandHandlers.Chat;

/// <summary>
/// Handler for soft-deleting chat messages
/// </summary>
public class DeleteChatMessageCommandHandler(
    INotificationUnitOfWork unitOfWork,
    ILogger<DeleteChatMessageCommandHandler> logger)
    : BaseCommandHandler<DeleteChatMessageCommand, bool>(logger)
{
    private readonly INotificationUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<bool>> Handle(
        DeleteChatMessageCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Get the message
            var message = await _unitOfWork.ChatMessages
                .GetByIdAsync(request.MessageId, cancellationToken);

            if (message == null)
            {
                throw new ResourceNotFoundException("ChatMessage", request.MessageId);
            }

            // Verify the user is the sender
            if (message.SenderId != request.UserId)
            {
                return Error("You can only delete your own messages", ErrorCodes.InsufficientPermissions);
            }

            // Check if already deleted
            if (message.IsDeleted)
            {
                return Error("Message is already deleted", ErrorCodes.OperationNotAllowed);
            }

            // Soft delete - mark as deleted and replace content
            message.IsDeleted = true;
            message.DeletedAt = DateTime.UtcNow;
            message.Content = "[Nachricht wurde gelöscht]";
            message.RenderedHtml = null;

            // Clear sensitive data
            message.EncryptedContent = null;
            message.EncryptionIV = null;

            await _unitOfWork.ChatMessages.UpdateAsync(message, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            Logger.LogInformation(
                "Message {MessageId} deleted by user {UserId}",
                request.MessageId, request.UserId);

            return Success(true, "Message deleted successfully");
        }
        catch (ResourceNotFoundException)
        {
            throw;
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error deleting message {MessageId}", request.MessageId);
            return Error("An error occurred while deleting the message", ErrorCodes.InternalError);
        }
    }
}
