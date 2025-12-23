using System.Text.Json;
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
/// Handler for getting chat messages for a thread
/// </summary>
public class GetChatMessagesQueryHandler(
    INotificationUnitOfWork unitOfWork,
    ILogger<GetChatMessagesQueryHandler> logger)
    : BasePagedQueryHandler<GetChatMessagesQuery, ChatMessageResponse>(logger)
{
    private readonly INotificationUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<PagedResponse<ChatMessageResponse>> Handle(
        GetChatMessagesQuery request,
        CancellationToken cancellationToken)
    {
        try
        {
            // Verify user has access to this thread
            var thread = await _unitOfWork.ChatThreads
                .GetByThreadIdAsync(request.ThreadId, cancellationToken);

            if (thread == null)
            {
                return Error("Chat thread not found", ErrorCodes.ResourceNotFound);
            }

            if (!thread.IsParticipant(request.UserId))
            {
                return Error("You are not a participant of this chat", ErrorCodes.InsufficientPermissions);
            }

            List<ChatMessage> messages;
            int totalCount;

            // Handle different query modes
            if (!string.IsNullOrEmpty(request.AfterMessageId))
            {
                messages = await _unitOfWork.ChatMessages
                    .GetAfterMessageIdAsync(request.ThreadId, request.AfterMessageId, request.PageSize, cancellationToken);
                totalCount = messages.Count;
            }
            else if (request.AfterTimestamp.HasValue)
            {
                messages = await _unitOfWork.ChatMessages
                    .GetAfterTimestampAsync(request.ThreadId, request.AfterTimestamp.Value, request.PageSize, cancellationToken);
                totalCount = messages.Count;
            }
            else if (!string.IsNullOrEmpty(request.SearchTerm))
            {
                messages = await _unitOfWork.ChatMessages
                    .SearchAsync(request.ThreadId, request.SearchTerm, request.PageNumber, request.PageSize, cancellationToken);
                totalCount = messages.Count < request.PageSize
                    ? (request.PageNumber - 1) * request.PageSize + messages.Count
                    : (request.PageNumber + 1) * request.PageSize;
            }
            else if (!string.IsNullOrEmpty(request.MessageType))
            {
                messages = await _unitOfWork.ChatMessages
                    .GetByTypeAsync(request.ThreadId, request.MessageType, request.PageNumber, request.PageSize, cancellationToken);
                totalCount = await _unitOfWork.ChatMessages.GetCountByThreadIdAsync(request.ThreadId, cancellationToken);
            }
            else if (!string.IsNullOrEmpty(request.Context))
            {
                messages = await _unitOfWork.ChatMessages
                    .GetByContextAsync(request.ThreadId, request.Context, request.ContextReferenceId, request.PageNumber, request.PageSize, cancellationToken);
                totalCount = messages.Count;
            }
            else
            {
                messages = await _unitOfWork.ChatMessages
                    .GetByThreadIdAsync(request.ThreadId, request.PageNumber, request.PageSize, cancellationToken);
                totalCount = await _unitOfWork.ChatMessages.GetCountByThreadIdAsync(request.ThreadId, cancellationToken);
            }

            var responses = messages.Select(m => MapToResponse(m, request.UserId)).ToList();

            return Success(responses, request.PageNumber, request.PageSize, totalCount);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "Error retrieving chat messages for thread {ThreadId}", request.ThreadId);
            return Error("An error occurred while retrieving chat messages", ErrorCodes.InternalError);
        }
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
            // E2EE
            IsEncrypted = message.IsEncrypted,
            EncryptedContent = message.EncryptedContent,
            EncryptionKeyId = message.EncryptionKeyId,
            EncryptionIV = message.EncryptionIV,
            // File
            FileUrl = message.FileUrl,
            FileName = message.FileName,
            FileMimeType = message.FileMimeType,
            FileSize = message.FileSize,
            FileSizeDisplay = message.FileSize.HasValue ? ChatAttachment.FormatFileSize(message.FileSize.Value) : null,
            ThumbnailUrl = message.ThumbnailUrl,
            ImageWidth = message.ImageWidth,
            ImageHeight = message.ImageHeight,
            // Code
            CodeLanguage = message.CodeLanguage,
            // GIF
            GiphyId = message.GiphyId,
            GifUrl = message.GifUrl,
            // Reply
            ReplyToMessageId = message.ReplyToMessageId,
            ReplyToPreview = message.ReplyToPreview,
            ReplyToSenderName = message.ReplyToSenderName,
            // Read status
            ReadAt = message.ReadAt,
            IsRead = message.IsRead,
            DeliveredAt = message.DeliveredAt,
            // Reactions
            Reactions = DeserializeReactions(message.ReactionsJson),
            ReactionCount = message.ReactionCount,
            // Attachments
            Attachments = message.Attachments?.Select(MapAttachmentToResponse).ToList(),
            // Computed
            IsMine = message.SenderId == currentUserId
        };
    }

    private static ChatAttachmentResponse MapAttachmentToResponse(ChatAttachment attachment)
    {
        return new ChatAttachmentResponse
        {
            Id = attachment.Id,
            FileName = attachment.FileName,
            OriginalFileName = attachment.OriginalFileName,
            MimeType = attachment.MimeType,
            FileSize = attachment.FileSize,
            FileSizeDisplay = attachment.FileSizeDisplay,
            StorageUrl = attachment.StorageUrl,
            ThumbnailUrl = attachment.ThumbnailUrl,
            Width = attachment.Width,
            Height = attachment.Height,
            DurationSeconds = attachment.DurationSeconds,
            IsEncrypted = attachment.IsEncrypted,
            FileCategory = attachment.GetFileCategory(),
            FileIcon = attachment.GetFileIcon(),
            UploadedAt = attachment.UploadedAt
        };
    }

    private static Dictionary<string, List<string>>? DeserializeReactions(string? reactionsJson)
    {
        if (string.IsNullOrEmpty(reactionsJson))
            return null;

        try
        {
            return JsonSerializer.Deserialize<Dictionary<string, List<string>>>(reactionsJson);
        }
        catch
        {
            return null;
        }
    }
}
