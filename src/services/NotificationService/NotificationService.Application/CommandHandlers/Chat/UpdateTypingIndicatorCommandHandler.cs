using Core.Common.Exceptions;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using NotificationService.Application.Commands.Chat;
using NotificationService.Domain.Repositories;

namespace NotificationService.Application.CommandHandlers.Chat;

/// <summary>
/// Handler for updating typing indicator
/// </summary>
public class UpdateTypingIndicatorCommandHandler(
    INotificationUnitOfWork unitOfWork,
    ILogger<UpdateTypingIndicatorCommandHandler> logger)
    : BaseCommandHandler<UpdateTypingIndicatorCommand, bool>(logger)
{
    private readonly INotificationUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<bool>> Handle(
        UpdateTypingIndicatorCommand request,
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

            await _unitOfWork.ChatThreads.UpdateTypingIndicatorAsync(
                request.ThreadId, request.UserId, request.IsTyping, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return Success(true);
        }
        catch (ResourceNotFoundException)
        {
            throw;
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error updating typing indicator in thread {ThreadId}", request.ThreadId);
            return Error("An error occurred while updating typing indicator", ErrorCodes.InternalError);
        }
    }
}
