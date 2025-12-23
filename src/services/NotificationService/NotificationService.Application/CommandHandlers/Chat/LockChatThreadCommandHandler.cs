using Core.Common.Exceptions;
using CQRS.Handlers;
using CQRS.Models;
using Microsoft.Extensions.Logging;
using NotificationService.Application.Commands.Chat;
using NotificationService.Domain.Entities;
using NotificationService.Domain.Repositories;

namespace NotificationService.Application.CommandHandlers.Chat;

/// <summary>
/// Handler for locking chat threads
/// </summary>
public class LockChatThreadCommandHandler(
    INotificationUnitOfWork unitOfWork,
    ILogger<LockChatThreadCommandHandler> logger)
    : BaseCommandHandler<LockChatThreadCommand, bool>(logger)
{
    private readonly INotificationUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<bool>> Handle(
        LockChatThreadCommand request,
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

            if (thread.IsLocked)
            {
                Logger.LogInformation(
                    "Thread {ThreadId} is already locked with reason {Reason}",
                    request.ThreadId, thread.LockReason);
                return Success(true, "Chat thread is already locked");
            }

            // Lock the thread
            thread.Lock(request.Reason);
            await _unitOfWork.ChatThreads.UpdateAsync(thread, cancellationToken);

            // Add system message
            var reasonText = request.Reason switch
            {
                "SessionsCompleted" => "All learning sessions have been completed.",
                "MatchDissolved" => "The match has been dissolved.",
                "ManualLock" => "This chat has been locked.",
                "UserBlocked" => "This chat has been locked due to a block.",
                "Violation" => "This chat has been locked due to a policy violation.",
                _ => "This chat has been locked."
            };

            var systemMessage = ChatMessage.CreateSystemMessage(
                request.ThreadId,
                $"Chat locked: {reasonText}");

            await _unitOfWork.ChatMessages.AddAsync(systemMessage, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            Logger.LogInformation(
                "Locked chat thread {ThreadId} with reason {Reason}",
                request.ThreadId, request.Reason);

            return Success(true, "Chat thread locked successfully");
        }
        catch (ResourceNotFoundException)
        {
            throw;
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error locking chat thread {ThreadId}", request.ThreadId);
            return Error("An error occurred while locking the chat thread", ErrorCodes.InternalError);
        }
    }
}
