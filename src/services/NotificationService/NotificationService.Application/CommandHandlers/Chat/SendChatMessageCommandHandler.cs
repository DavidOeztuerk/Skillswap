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
/// Handler for sending chat messages
/// </summary>
public class SendChatMessageCommandHandler(
    INotificationUnitOfWork unitOfWork,
    ILogger<SendChatMessageCommandHandler> logger)
    : BaseCommandHandler<SendChatMessageCommand, ChatMessageResponse>(logger)
{
    private readonly INotificationUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<ChatMessageResponse>> Handle(
        SendChatMessageCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Get the thread and verify access
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

            if (thread.IsLocked)
            {
                return Error($"This chat is locked: {thread.LockReason}", ErrorCodes.OperationNotAllowed);
            }

            // Handle reply-to message
            string? replyToPreview = null;
            string? replyToSenderName = null;
            if (!string.IsNullOrEmpty(request.ReplyToMessageId))
            {
                var replyToMessage = await _unitOfWork.ChatMessages
                    .GetByIdAsync(request.ReplyToMessageId, cancellationToken);
                if (replyToMessage != null)
                {
                    replyToPreview = replyToMessage.Content.Length > 100
                        ? replyToMessage.Content[..97] + "..."
                        : replyToMessage.Content;
                    replyToSenderName = replyToMessage.SenderName;
                }
            }

            // Create the message
            var message = new ChatMessage
            {
                ThreadId = request.ThreadId,
                SenderId = request.UserId,
                SenderName = request.UserName,
                SenderAvatarUrl = request.UserAvatarUrl,
                Content = request.Content,
                MessageType = request.MessageType,
                Context = request.Context,
                ContextReferenceId = request.ContextReferenceId,
                SentAt = DateTime.UtcNow,
                // Reply
                ReplyToMessageId = request.ReplyToMessageId,
                ReplyToPreview = replyToPreview,
                ReplyToSenderName = replyToSenderName,
                // Code
                CodeLanguage = request.CodeLanguage,
                // GIF
                GiphyId = request.GiphyId,
                GifUrl = request.GifUrl,
                // E2EE
                IsEncrypted = request.IsEncrypted,
                EncryptedContent = request.EncryptedContent,
                EncryptionKeyId = request.EncryptionKeyId,
                EncryptionIV = request.EncryptionIV
            };

            // Render Markdown to HTML for non-encrypted text messages
            if (request.MessageType == ChatMessageType.Text && !request.IsEncrypted)
            {
                message.RenderedHtml = RenderMarkdown(request.Content);
            }

            await _unitOfWork.ChatMessages.AddAsync(message, cancellationToken);

            // Update thread with last message info
            thread.UpdateLastMessage(request.UserId, request.Content, message.SentAt);
            thread.IncrementUnreadCount(request.UserId);
            await _unitOfWork.ChatThreads.UpdateAsync(thread, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            Logger.LogInformation(
                "Message sent in thread {ThreadId} by user {UserId}",
                request.ThreadId, request.UserId);

            var response = MapToResponse(message, request.UserId);
            return Success(response, "Message sent successfully");
        }
        catch (ResourceNotFoundException)
        {
            throw;
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error sending message to thread {ThreadId}", request.ThreadId);
            return Error("An error occurred while sending the message", ErrorCodes.InternalError);
        }
    }

    private static string RenderMarkdown(string content)
    {
        // Basic Markdown rendering - in production, use Markdig library
        // For now, just escape HTML and handle basic formatting
        var html = System.Web.HttpUtility.HtmlEncode(content);

        // Bold: **text** -> <strong>text</strong>
        html = System.Text.RegularExpressions.Regex.Replace(
            html, @"\*\*(.+?)\*\*", "<strong>$1</strong>");

        // Italic: *text* -> <em>text</em>
        html = System.Text.RegularExpressions.Regex.Replace(
            html, @"\*(.+?)\*", "<em>$1</em>");

        // Inline code: `code` -> <code>code</code>
        html = System.Text.RegularExpressions.Regex.Replace(
            html, @"`(.+?)`", "<code>$1</code>");

        // Line breaks
        html = html.Replace("\n", "<br/>");

        return html;
    }

    private static ChatMessageResponse MapToResponse(ChatMessage message, string currentUserId)
    {
        return new ChatMessageResponse
        {
            Id = message.Id,
            ThreadId = message.ThreadId,
            SenderId = message.SenderId,
            SenderName = message.SenderName,
            SenderAvatarUrl = message.SenderAvatarUrl,
            Content = message.Content,
            RenderedHtml = message.RenderedHtml,
            CreatedAt = message.SentAt,
            EditedAt = message.EditedAt,
            IsEdited = message.IsEdited,
            MessageType = message.MessageType,
            Context = message.Context,
            ContextReferenceId = message.ContextReferenceId,
            IsEncrypted = message.IsEncrypted,
            EncryptedContent = message.EncryptedContent,
            EncryptionKeyId = message.EncryptionKeyId,
            EncryptionIV = message.EncryptionIV,
            CodeLanguage = message.CodeLanguage,
            GiphyId = message.GiphyId,
            GifUrl = message.GifUrl,
            ReplyToMessageId = message.ReplyToMessageId,
            ReplyToPreview = message.ReplyToPreview,
            ReplyToSenderName = message.ReplyToSenderName,
            IsMine = message.SenderId == currentUserId
        };
    }
}
