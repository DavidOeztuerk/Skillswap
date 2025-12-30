using System.Collections.Concurrent;
using System.Security.Claims;
using System.Text.Json;
using Contracts.Chat.Responses;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using NotificationService.Application.Commands.Chat;
using NotificationService.Application.Queries.Chat;
using NotificationService.Domain.Entities;
using NotificationService.Domain.Repositories;

namespace NotificationService.Infrastructure.Hubs;

/// <summary>
/// SignalR Hub for real-time chat functionality.
/// Provides methods for joining threads, sending messages, typing indicators, and reactions.
/// </summary>
[Authorize]
public class ChatHub : Hub
{
    private readonly IMediator _mediator;
    private readonly INotificationUnitOfWork _unitOfWork;
    private readonly ILogger<ChatHub> _logger;

    // Thread -> List of ConnectionIds
    private static readonly ConcurrentDictionary<string, HashSet<string>> _threadConnections = new();
    // ConnectionId -> UserId
    private static readonly ConcurrentDictionary<string, string> _connectionUsers = new();
    // UserId -> List of ConnectionIds
    private static readonly ConcurrentDictionary<string, HashSet<string>> _userConnections = new();

    public ChatHub(
        IMediator mediator,
        INotificationUnitOfWork unitOfWork,
        ILogger<ChatHub> logger)
    {
        _mediator = mediator;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    #region Connection Lifecycle

    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            Context.Abort();
            return;
        }

        // Track user connection
        _connectionUsers[Context.ConnectionId] = userId;
        _userConnections.AddOrUpdate(
            userId,
            _ => [Context.ConnectionId],
            (_, set) => { set.Add(Context.ConnectionId); return set; });

        // Add to user group for direct messages
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");

        _logger.LogInformation("User {UserId} connected to ChatHub with connection {ConnectionId}",
            userId, Context.ConnectionId);

        // Send initial unread count
        await SendUnreadCount();

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();

        if (!string.IsNullOrEmpty(userId))
        {
            // Remove from all thread groups
            foreach (var threadId in _threadConnections.Keys)
            {
                if (_threadConnections.TryGetValue(threadId, out var connections))
                {
                    connections.Remove(Context.ConnectionId);
                    if (connections.Count == 0)
                    {
                        _threadConnections.TryRemove(threadId, out _);
                    }
                }
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"thread-{threadId}");

                // Clear typing indicator
                await _unitOfWork.ChatThreads.UpdateTypingIndicatorAsync(
                    threadId, userId, false, CancellationToken.None);
            }

            // Remove from user connections
            if (_userConnections.TryGetValue(userId, out var userConns))
            {
                userConns.Remove(Context.ConnectionId);
                if (userConns.Count == 0)
                {
                    _userConnections.TryRemove(userId, out _);
                }
            }

            _connectionUsers.TryRemove(Context.ConnectionId, out _);
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user-{userId}");

            _logger.LogInformation("User {UserId} disconnected from ChatHub", userId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    #endregion

    #region Thread Operations

    /// <summary>
    /// Join a chat thread to receive messages
    /// </summary>
    public async Task JoinThread(string threadId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return;

        try
        {
            // Verify access
            var thread = await _unitOfWork.ChatThreads.GetByThreadIdAsync(threadId);
            if (thread == null || !thread.IsParticipant(userId))
            {
                await Clients.Caller.SendAsync("Error", "You are not a participant of this chat");
                return;
            }

            // Add to thread group
            await Groups.AddToGroupAsync(Context.ConnectionId, $"thread-{threadId}");
            _threadConnections.AddOrUpdate(
                threadId,
                _ => [Context.ConnectionId],
                (_, set) => { set.Add(Context.ConnectionId); return set; });

            _logger.LogDebug("User {UserId} joined thread {ThreadId}", userId, threadId);

            // Send thread info and recent messages
            await Clients.Caller.SendAsync("ThreadJoined", new
            {
                ThreadId = threadId,
                IsLocked = thread.IsLocked,
                LockReason = thread.LockReason
            });

            // Mark messages as read
            await _mediator.Send(new MarkMessagesAsReadCommand(userId, threadId));
            await _unitOfWork.SaveChangesAsync();

            // Notify other participant that messages were read
            var otherUserId = thread.GetOtherParticipantId(userId);
            await Clients.Group($"user-{otherUserId}").SendAsync("MessagesRead", new
            {
                ThreadId = threadId,
                ReadBy = userId,
                ReadAt = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error joining thread {ThreadId}", threadId);
            await Clients.Caller.SendAsync("Error", "Failed to join chat thread");
        }
    }

    /// <summary>
    /// Leave a chat thread
    /// </summary>
    public async Task LeaveThread(string threadId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return;

        try
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"thread-{threadId}");

            if (_threadConnections.TryGetValue(threadId, out var connections))
            {
                connections.Remove(Context.ConnectionId);
            }

            // Clear typing indicator
            await _unitOfWork.ChatThreads.UpdateTypingIndicatorAsync(threadId, userId, false);
            await _unitOfWork.SaveChangesAsync();

            // Notify other participant
            var thread = await _unitOfWork.ChatThreads.GetByThreadIdAsync(threadId);
            if (thread != null)
            {
                var otherUserId = thread.GetOtherParticipantId(userId);
                await Clients.Group($"user-{otherUserId}").SendAsync("TypingIndicator", new
                {
                    ThreadId = threadId,
                    UserId = userId,
                    IsTyping = false
                });
            }

            _logger.LogDebug("User {UserId} left thread {ThreadId}", userId, threadId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error leaving thread {ThreadId}", threadId);
        }
    }

    #endregion

    #region Messaging

    /// <summary>
    /// Send a message to a thread
    /// </summary>
    public async Task SendMessage(
        string threadId,
        string content,
        string messageType = "Text",
        string context = "Direct",
        string? contextReferenceId = null,
        string? replyToMessageId = null,
        string? codeLanguage = null,
        string? giphyId = null,
        string? gifUrl = null,
        bool isEncrypted = false,
        string? encryptedContent = null,
        string? encryptionKeyId = null,
        string? encryptionIV = null)
    {
        var userId = GetUserId();
        var userName = GetUserName();
        var userAvatarUrl = GetUserAvatarUrl();

        if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(userName))
        {
            await Clients.Caller.SendAsync("Error", "User not authenticated");
            return;
        }

        try
        {
            var command = new SendChatMessageCommand(
                userId, userName, userAvatarUrl,
                threadId, content, messageType, context, contextReferenceId,
                replyToMessageId, codeLanguage, giphyId, gifUrl,
                isEncrypted, encryptedContent, encryptionKeyId, encryptionIV);

            var result = await _mediator.Send(command);

            if (!result.Success)
            {
                await Clients.Caller.SendAsync("MessageError", result.Message);
                return;
            }

            // Clear typing indicator
            await _unitOfWork.ChatThreads.UpdateTypingIndicatorAsync(threadId, userId, false);
            await _unitOfWork.SaveChangesAsync();

            // Send to all participants in the thread
            await Clients.Group($"thread-{threadId}").SendAsync("NewMessage", result.Data);

            // Also send to users not in thread group (for notifications)
            var thread = await _unitOfWork.ChatThreads.GetByThreadIdAsync(threadId);
            if (thread != null)
            {
                var otherUserId = thread.GetOtherParticipantId(userId);
                await Clients.Group($"user-{otherUserId}").SendAsync("NewChatMessage", new
                {
                    ThreadId = threadId,
                    Message = result.Data,
                    UnreadCount = thread.GetUnreadCount(otherUserId)
                });
            }

            _logger.LogDebug("Message sent in thread {ThreadId} by user {UserId}", threadId, userId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending message to thread {ThreadId}", threadId);
            await Clients.Caller.SendAsync("MessageError", "Failed to send message");
        }
    }

    #endregion

    #region Typing Indicator

    /// <summary>
    /// Update typing indicator
    /// </summary>
    public async Task SendTyping(string threadId, bool isTyping)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return;

        try
        {
            var thread = await _unitOfWork.ChatThreads.GetByThreadIdAsync(threadId);
            if (thread == null || !thread.IsParticipant(userId)) return;

            await _unitOfWork.ChatThreads.UpdateTypingIndicatorAsync(threadId, userId, isTyping);
            await _unitOfWork.SaveChangesAsync();

            // Notify other participant
            var otherUserId = thread.GetOtherParticipantId(userId);
            await Clients.Group($"user-{otherUserId}").SendAsync("TypingIndicator", new
            {
                ThreadId = threadId,
                UserId = userId,
                UserName = GetUserName(),
                IsTyping = isTyping
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating typing indicator in thread {ThreadId}", threadId);
        }
    }

    #endregion

    #region Read Receipts

    /// <summary>
    /// Mark messages as read
    /// </summary>
    public async Task MarkAsRead(string threadId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return;

        try
        {
            var result = await _mediator.Send(new MarkMessagesAsReadCommand(userId, threadId));

            if (result.Success)
            {
                var thread = await _unitOfWork.ChatThreads.GetByThreadIdAsync(threadId);
                if (thread != null)
                {
                    var otherUserId = thread.GetOtherParticipantId(userId);
                    await Clients.Group($"user-{otherUserId}").SendAsync("MessagesRead", new
                    {
                        ThreadId = threadId,
                        ReadBy = userId,
                        ReadAt = DateTime.UtcNow
                    });
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking messages as read in thread {ThreadId}", threadId);
        }
    }

    #endregion

    #region E2EE Key Exchange

    /// <summary>
    /// Send E2EE key offer to peer
    /// </summary>
    public async Task SendKeyOffer(string threadId, string publicKey, string fingerprint)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return;

        try
        {
            var thread = await _unitOfWork.ChatThreads.GetByThreadIdAsync(threadId);
            if (thread == null || !thread.IsParticipant(userId))
            {
                await Clients.Caller.SendAsync("E2EEError", "Not a participant of this chat");
                return;
            }

            var otherUserId = thread.GetOtherParticipantId(userId);

            _logger.LogDebug("E2EE KeyOffer from {UserId} to {OtherUserId} in thread {ThreadId}",
                userId, otherUserId, threadId);

            await Clients.Group($"user-{otherUserId}").SendAsync("ReceiveKeyOffer", new
            {
                ThreadId = threadId,
                SenderId = userId,
                PublicKey = publicKey,
                Fingerprint = fingerprint,
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending key offer in thread {ThreadId}", threadId);
            await Clients.Caller.SendAsync("E2EEError", "Failed to send key offer");
        }
    }

    /// <summary>
    /// Send E2EE key answer to peer
    /// </summary>
    public async Task SendKeyAnswer(string threadId, string publicKey, string fingerprint)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return;

        try
        {
            var thread = await _unitOfWork.ChatThreads.GetByThreadIdAsync(threadId);
            if (thread == null || !thread.IsParticipant(userId))
            {
                await Clients.Caller.SendAsync("E2EEError", "Not a participant of this chat");
                return;
            }

            var otherUserId = thread.GetOtherParticipantId(userId);

            _logger.LogDebug("E2EE KeyAnswer from {UserId} to {OtherUserId} in thread {ThreadId}",
                userId, otherUserId, threadId);

            await Clients.Group($"user-{otherUserId}").SendAsync("ReceiveKeyAnswer", new
            {
                ThreadId = threadId,
                SenderId = userId,
                PublicKey = publicKey,
                Fingerprint = fingerprint,
                Timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending key answer in thread {ThreadId}", threadId);
            await Clients.Caller.SendAsync("E2EEError", "Failed to send key answer");
        }
    }

    /// <summary>
    /// Notify peer that E2EE is ready
    /// </summary>
    public async Task SendE2EEReady(string threadId, string fingerprint)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return;

        try
        {
            var thread = await _unitOfWork.ChatThreads.GetByThreadIdAsync(threadId);
            if (thread == null || !thread.IsParticipant(userId)) return;

            var otherUserId = thread.GetOtherParticipantId(userId);

            _logger.LogDebug("E2EE Ready from {UserId} in thread {ThreadId}", userId, threadId);

            await Clients.Group($"user-{otherUserId}").SendAsync("ReceiveE2EEReady", new
            {
                ThreadId = threadId,
                SenderId = userId,
                Fingerprint = fingerprint
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending E2EE ready in thread {ThreadId}", threadId);
        }
    }

    #endregion

    #region Message Operations

    /// <summary>
    /// Delete a message (soft delete)
    /// </summary>
    public async Task DeleteMessage(string messageId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return;

        try
        {
            var message = await _unitOfWork.ChatMessages.GetByIdAsync(messageId);
            if (message == null)
            {
                await Clients.Caller.SendAsync("Error", "Message not found");
                return;
            }

            // Only the sender can delete their own message
            if (message.SenderId != userId)
            {
                await Clients.Caller.SendAsync("Error", "You can only delete your own messages");
                return;
            }

            var thread = await _unitOfWork.ChatThreads.GetByThreadIdAsync(message.ThreadId);
            if (thread == null)
            {
                await Clients.Caller.SendAsync("Error", "Thread not found");
                return;
            }

            // Soft delete the message
            message.MarkAsDeleted(userId);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("Message {MessageId} deleted by user {UserId}", messageId, userId);

            // Notify all participants in the thread
            await Clients.Group($"thread-{message.ThreadId}").SendAsync("MessageDeleted", new
            {
                MessageId = messageId,
                ThreadId = message.ThreadId,
                DeletedBy = userId,
                DeletedAt = DateTime.UtcNow
            });

            // Also notify users not currently in thread
            var otherUserId = thread.GetOtherParticipantId(userId);
            await Clients.Group($"user-{otherUserId}").SendAsync("MessageDeleted", new
            {
                MessageId = messageId,
                ThreadId = message.ThreadId,
                DeletedBy = userId,
                DeletedAt = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting message {MessageId}", messageId);
            await Clients.Caller.SendAsync("Error", "Failed to delete message");
        }
    }

    #endregion

    #region Reactions

    /// <summary>
    /// Add or remove a reaction to a message
    /// </summary>
    public async Task ToggleReaction(string messageId, string emoji)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return;

        try
        {
            // Check if reaction exists
            var message = await _unitOfWork.ChatMessages.GetByIdAsync(messageId);
            if (message == null) return;

            // Don't allow reacting to own messages
            if (message.SenderId == userId)
            {
                _logger.LogWarning("User {UserId} tried to react to their own message {MessageId}", userId, messageId);
                return;
            }

            var reactions = string.IsNullOrEmpty(message.ReactionsJson)
                ? new Dictionary<string, List<string>>()
                : JsonSerializer.Deserialize<Dictionary<string, List<string>>>(message.ReactionsJson) ?? [];

            var shouldRemove = reactions.TryGetValue(emoji, out var users) && users.Contains(userId);

            var result = await _mediator.Send(new AddReactionCommand(userId, messageId, emoji, shouldRemove));

            if (result.Success)
            {
                // Notify all participants in thread
                await Clients.Group($"thread-{message.ThreadId}").SendAsync("ReactionUpdated", new
                {
                    MessageId = messageId,
                    Emoji = emoji,
                    UserId = userId,
                    Added = !shouldRemove
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error toggling reaction on message {MessageId}", messageId);
        }
    }

    #endregion

    #region Static Methods for External Use

    /// <summary>
    /// Send a message to a user's chat list
    /// </summary>
    public static async Task SendMessageToUser(
        IHubContext<ChatHub> hubContext,
        string userId,
        ChatMessageResponse message)
    {
        await hubContext.Clients.Group($"user-{userId}").SendAsync("NewChatMessage", new
        {
            message.ThreadId,
            Message = message
        });
    }

    /// <summary>
    /// Send a message to all participants in a thread
    /// </summary>
    public static async Task SendMessageToThread(
        IHubContext<ChatHub> hubContext,
        string threadId,
        ChatMessageResponse message)
    {
        await hubContext.Clients.Group($"thread-{threadId}").SendAsync("NewMessage", message);
    }

    /// <summary>
    /// Notify users that a thread was created
    /// </summary>
    public static async Task NotifyThreadCreated(
        IHubContext<ChatHub> hubContext,
        string userId1,
        string userId2,
        ChatThreadResponse thread)
    {
        await hubContext.Clients.Group($"user-{userId1}").SendAsync("ThreadCreated", thread);
        await hubContext.Clients.Group($"user-{userId2}").SendAsync("ThreadCreated", thread);
    }

    /// <summary>
    /// Notify users that a thread was locked
    /// </summary>
    public static async Task NotifyThreadLocked(
        IHubContext<ChatHub> hubContext,
        string threadId,
        string reason)
    {
        await hubContext.Clients.Group($"thread-{threadId}").SendAsync("ThreadLocked", new
        {
            ThreadId = threadId,
            Reason = reason,
            LockedAt = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Check if a user is connected
    /// </summary>
    public static bool IsUserConnected(string userId)
    {
        return _userConnections.TryGetValue(userId, out var connections) && connections.Count > 0;
    }

    #endregion

    #region Private Helpers

    private async Task SendUnreadCount()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return;

        try
        {
            var result = await _mediator.Send(new GetChatUnreadCountQuery(userId));
            if (result.Success && result.Data != null)
            {
                await Clients.Caller.SendAsync("ChatUnreadCount", result.Data);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending unread count to user {UserId}", userId);
        }
    }

    private string? GetUserId() =>
        Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    private string? GetUserName() =>
        Context.User?.FindFirst(ClaimTypes.Name)?.Value ??
        Context.User?.FindFirst("name")?.Value ??
        "User";

    private string? GetUserAvatarUrl() =>
        Context.User?.FindFirst("avatar_url")?.Value ??
        Context.User?.FindFirst("picture")?.Value;

    #endregion
}
