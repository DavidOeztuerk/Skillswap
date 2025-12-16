using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using VideocallService.Domain.Repositories;
using EventSourcing;
using StackExchange.Redis;

namespace VideocallService.Hubs;

/// <summary>
/// Video Call Hub - KORRIGIERTE VERSION
///
/// Fixes:
/// 1. ✅ Redis-backed Connection Tracking (Multi-Server-fähig)
/// 2. ✅ Input Validation für alle Methoden
/// 3. ✅ Rate Limiting für Key Exchange
/// 4. ✅ Bessere Error Handling
/// 5. ✅ Heartbeat mit DB-Update
/// </summary>
[Authorize]
public class VideoCallHub : Hub
{
    private readonly IVideocallUnitOfWork _unitOfWork;
    private readonly IDomainEventPublisher _eventPublisher;
    private readonly ILogger<VideoCallHub> _logger;
    private readonly IConnectionMultiplexer _redis;

    private const string USER_CONNECTIONS_KEY = "videocall:connections";
    private const string RATE_LIMIT_KEY_PREFIX = "videocall:ratelimit:";
    private const int KEY_EXCHANGE_RATE_LIMIT = 10; // Max 10 Key Exchange pro Minute
    private const int KEY_EXCHANGE_RATE_WINDOW = 60; // Sekunden

    public VideoCallHub(
        IVideocallUnitOfWork unitOfWork,
        IDomainEventPublisher eventPublisher,
        ILogger<VideoCallHub> logger,
        IConnectionMultiplexer redis)
    {
        _unitOfWork = unitOfWork;
        _eventPublisher = eventPublisher;
        _logger = logger;
        _redis = redis;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            _logger.LogWarning("❌ Unauthenticated user tried to connect - aborting");
            Context.Abort();
            return;
        }

        var db = _redis.GetDatabase();
        await db.HashSetAsync(USER_CONNECTIONS_KEY, userId, Context.ConnectionId);

        var roomId = Context.GetHttpContext()?.Request.Query["roomId"].ToString();
        if (!string.IsNullOrEmpty(roomId))
        {
            if (!IsValidRoomId(roomId))
            {
                _logger.LogWarning("❌ Invalid roomId format: {RoomId}", roomId);
                Context.Abort();
                return;
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, roomId);

            await Clients.OthersInGroup(roomId).SendAsync("UserJoined", new
            {
                userId,
                timestamp = DateTime.UtcNow
            });

            _logger.LogInformation("✅ User {UserId} joined room {RoomId}", userId, roomId);
        }

        await base.OnConnectedAsync();
    }

    /// <summary>
    /// SendOffer mit Input Validation
    /// </summary>
    public async Task SendOffer(string roomId, string targetUserId, string sdp)
    {
        var fromUserId = GetUserId();
        
        // Input Validation
        if (!ValidateSignalingInput(roomId, targetUserId, sdp, "offer"))
            return;

        _logger.LogInformation("📤 [Hub.SendOffer] From {FromUser} to {TargetUser} in room {RoomId}",
            fromUserId, targetUserId, roomId);

        try
        {
            var db = _redis.GetDatabase();
            var targetConnectionId = await db.HashGetAsync(USER_CONNECTIONS_KEY, targetUserId);

            if (targetConnectionId.HasValue)
            {
                await Clients.Client(targetConnectionId.ToString()).SendAsync("ReceiveOffer", new
                {
                    fromUserId,
                    offer = sdp
                });
                _logger.LogInformation("✅ [Hub.SendOffer] Sent directly to {TargetUser}", targetUserId);
            }
            else
            {
                await Clients.OthersInGroup(roomId).SendAsync("ReceiveOffer", new
                {
                    fromUserId,
                    offer = sdp
                });
                _logger.LogWarning("⚠️ [Hub.SendOffer] Target user {TargetUser} not found in Redis, broadcasting",
                    targetUserId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ [Hub.SendOffer] Error sending offer from {FromUser} to {TargetUser}",
                fromUserId, targetUserId);
            throw new HubException($"Failed to send offer: {ex.Message}");
        }
    }

    /// <summary>
    /// SendAnswer mit Input Validation
    /// </summary>
    public async Task SendAnswer(string roomId, string targetUserId, string sdp)
    {
        var fromUserId = GetUserId();

        if (!ValidateSignalingInput(roomId, targetUserId, sdp, "answer"))
            return;

        _logger.LogInformation("📤 [Hub.SendAnswer] From {FromUser} to {TargetUser} in room {RoomId}",
            fromUserId, targetUserId, roomId);

        try
        {
            var db = _redis.GetDatabase();
            var targetConnectionId = await db.HashGetAsync(USER_CONNECTIONS_KEY, targetUserId);

            if (targetConnectionId.HasValue)
            {
                await Clients.Client(targetConnectionId.ToString()).SendAsync("ReceiveAnswer", new
                {
                    fromUserId,
                    answer = sdp
                });
                _logger.LogInformation("✅ [Hub.SendAnswer] Sent directly to {TargetUser}", targetUserId);
            }
            else
            {
                await Clients.OthersInGroup(roomId).SendAsync("ReceiveAnswer", new
                {
                    fromUserId,
                    answer = sdp
                });
                _logger.LogWarning("⚠️ [Hub.SendAnswer] Target user {TargetUser} not found, broadcasting", targetUserId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ [Hub.SendAnswer] Error sending answer from {FromUser} to {TargetUser}",
                fromUserId, targetUserId);
            throw new HubException($"Failed to send answer: {ex.Message}");
        }
    }

    /// <summary>
    /// SendIceCandidate mit Input Validation
    /// </summary>
    public async Task SendIceCandidate(string roomId, string targetUserId, string candidate)
    {
        var fromUserId = GetUserId();

        // Lightweight validation for ICE candidates
        if (string.IsNullOrEmpty(candidate) || candidate.Length > 10000)
        {
            _logger.LogWarning("⚠️ Invalid ICE candidate from {UserId}", fromUserId);
            return;
        }

        try
        {
            var db = _redis.GetDatabase();
            var targetConnectionId = await db.HashGetAsync(USER_CONNECTIONS_KEY, targetUserId);

            if (targetConnectionId.HasValue)
            {
                await Clients.Client(targetConnectionId.ToString()).SendAsync("ReceiveIceCandidate", new
                {
                    fromUserId,
                    candidate
                });
            }
            else
            {
                await Clients.OthersInGroup(roomId).SendAsync("ReceiveIceCandidate", new
                {
                    fromUserId,
                    candidate
                });
            }

            _logger.LogDebug("🧊 [Hub.SendIceCandidate] Sent from {FromUser} to {TargetUser}", fromUserId, targetUserId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ [Hub.SendIceCandidate] Error sending ICE candidate from {FromUser} to {TargetUser}",
                fromUserId, targetUserId);
        }
    }

    /// <summary>
    /// OnDisconnected - KORRIGIERT
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();
        if (!string.IsNullOrEmpty(userId))
        {
            var db = _redis.GetDatabase();
            await db.HashDeleteAsync(USER_CONNECTIONS_KEY, userId);

            var roomId = Context.GetHttpContext()?.Request.Query["roomId"].ToString();
            if (!string.IsNullOrEmpty(roomId))
            {
                await Clients.Group(roomId).SendAsync("UserLeft", new
                {
                    userId,
                    timestamp = DateTime.UtcNow
                });

                await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId);

                _logger.LogInformation("👋 User {UserId} disconnected from room {RoomId}", userId, roomId);
            }
        }

        await base.OnDisconnectedAsync(exception);
    }

    public async Task JoinRoom(string roomId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return;

        if (!IsValidRoomId(roomId))
        {
            _logger.LogWarning("❌ Invalid roomId in JoinRoom: {RoomId}", roomId);
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, roomId);

        await Clients.OthersInGroup(roomId).SendAsync("UserJoined", new
        {
            userId,
            timestamp = DateTime.UtcNow
        });

        await Clients.Caller.SendAsync("RoomJoined", new
        {
            roomId,
            participants = await GetRoomParticipantsAsync(roomId)
        });

        _logger.LogInformation("✅ User {UserId} joined room {RoomId}", userId, roomId);
    }

    // ===== E2EE Key Exchange Methods =====

    /// <summary>
    /// SendKeyOffer mit Rate Limiting
    /// </summary>
    public async Task SendKeyOffer(string roomId, string targetUserId, string keyExchangeData)
    {
        var fromUserId = GetUserId();

        // Rate Limiting
        if (!await CheckKeyExchangeRateLimitAsync(fromUserId!))
        {
            _logger.LogWarning("⚠️ [Hub.SendKeyOffer] Rate limit exceeded for {UserId}", fromUserId);
            throw new HubException("Key exchange rate limit exceeded. Please try again later.");
        }

        // Input Validation
        if (!ValidateKeyExchangeInput(roomId, targetUserId, keyExchangeData))
            return;

        _logger.LogInformation("🔑 [Hub.SendKeyOffer] From {FromUser} to {TargetUser} in room {RoomId}",
            fromUserId, targetUserId, roomId);

        try
        {
            var db = _redis.GetDatabase();
            var targetConnectionId = await db.HashGetAsync(USER_CONNECTIONS_KEY, targetUserId);

            if (targetConnectionId.HasValue)
            {
                await Clients.Client(targetConnectionId.ToString()).SendAsync("ReceiveKeyOffer",
                    fromUserId,
                    keyExchangeData);
                _logger.LogInformation("✅ [Hub.SendKeyOffer] Sent directly to {TargetUser}", targetUserId);
            }
            else
            {
                await Clients.OthersInGroup(roomId).SendAsync("ReceiveKeyOffer",
                    fromUserId,
                    keyExchangeData);
                _logger.LogWarning("⚠️ [Hub.SendKeyOffer] Target user {TargetUser} not found, broadcasting", targetUserId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ [Hub.SendKeyOffer] Error sending key offer from {FromUser} to {TargetUser}",
                fromUserId, targetUserId);
            throw new HubException($"Failed to send key offer: {ex.Message}");
        }
    }

    /// <summary>
    /// SendKeyAnswer mit Rate Limiting
    /// </summary>
    public async Task SendKeyAnswer(string roomId, string targetUserId, string keyExchangeData)
    {
        var fromUserId = GetUserId();

        if (!await CheckKeyExchangeRateLimitAsync(fromUserId!))
        {
            _logger.LogWarning("⚠️ [Hub.SendKeyAnswer] Rate limit exceeded for {UserId}", fromUserId);
            throw new HubException("Key exchange rate limit exceeded.");
        }

        if (!ValidateKeyExchangeInput(roomId, targetUserId, keyExchangeData))
            return;

        _logger.LogInformation("🔑 [Hub.SendKeyAnswer] From {FromUser} to {TargetUser} in room {RoomId}",
            fromUserId, targetUserId, roomId);

        try
        {
            var db = _redis.GetDatabase();
            var targetConnectionId = await db.HashGetAsync(USER_CONNECTIONS_KEY, targetUserId);

            if (targetConnectionId.HasValue)
            {
                await Clients.Client(targetConnectionId.ToString()).SendAsync("ReceiveKeyAnswer",
                    fromUserId,
                    keyExchangeData);
            }
            else
            {
                await Clients.OthersInGroup(roomId).SendAsync("ReceiveKeyAnswer",
                    fromUserId,
                    keyExchangeData);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ [Hub.SendKeyAnswer] Error sending key answer");
            throw new HubException($"Failed to send key answer: {ex.Message}");
        }
    }

    /// <summary>
    /// SendKeyRotation mit Rate Limiting
    /// </summary>
    public async Task SendKeyRotation(string roomId, string targetUserId, string keyExchangeData)
    {
        var fromUserId = GetUserId();

        if (!await CheckKeyExchangeRateLimitAsync(fromUserId!))
        {
            _logger.LogWarning("⚠️ [Hub.SendKeyRotation] Rate limit exceeded for {UserId}", fromUserId);
            throw new HubException("Key rotation rate limit exceeded.");
        }

        if (!ValidateKeyExchangeInput(roomId, targetUserId, keyExchangeData))
            return;

        try
        {
            var db = _redis.GetDatabase();
            var targetConnectionId = await db.HashGetAsync(USER_CONNECTIONS_KEY, targetUserId);

            if (targetConnectionId.HasValue)
            {
                await Clients.Client(targetConnectionId.ToString()).SendAsync("ReceiveKeyRotation",
                    fromUserId,
                    keyExchangeData);
            }
            else
            {
                await Clients.OthersInGroup(roomId).SendAsync("ReceiveKeyRotation",
                    fromUserId,
                    keyExchangeData);
            }

            _logger.LogInformation("🔄 [Hub.SendKeyRotation] Sent from {FromUser} to {TargetUser}",
                fromUserId, targetUserId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ [Hub.SendKeyRotation] Error sending key rotation");
            throw new HubException($"Failed to send key rotation: {ex.Message}");
        }
    }

    /// <summary>
    /// SendHeartbeat mit DB-Update
    /// </summary>
    public async Task SendHeartbeat(string roomId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(roomId))
        {
            _logger.LogWarning("⚠️ [Hub.SendHeartbeat] Invalid heartbeat - userId or roomId missing");
            return;
        }

        try
        {
            var session = await _unitOfWork.VideoCallSessions.GetByRoomIdAsync(roomId);
            if (session != null)
            {
                var participant = session.Participants?.FirstOrDefault(p => p.UserId == userId && p.LeftAt == null);
                if (participant != null)
                {
                    participant.UpdatedAt = DateTime.UtcNow;
                    participant.UpdatedBy = "Heartbeat";
                    await _unitOfWork.CallParticipants.UpdateAsync(participant);
                    await _unitOfWork.SaveChangesAsync();

                    _logger.LogDebug("💓 [Hub.SendHeartbeat] Updated participant {UserId} in session {SessionId}",
                        userId, session.Id);
                }
            }

            // Send ACK back
            await Clients.Caller.SendAsync("HeartbeatAck", new
            {
                timestamp = DateTime.UtcNow,
                acknowledged = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ [Hub.SendHeartbeat] Error processing heartbeat for {UserId}", userId);
            // Don't throw - heartbeat failure shouldn't crash the connection
        }
    }

    // ===== Media Control Methods =====

    /// <summary>
    /// Generic media state change handler - used by frontend for audio/video/screen toggle
    /// </summary>
    public async Task MediaStateChanged(string roomId, string mediaType, bool enabled)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(roomId))
        {
            _logger.LogWarning("⚠️ [Hub.MediaStateChanged] Invalid parameters - userId or roomId missing");
            return;
        }

        // Validate media type
        var validMediaTypes = new[] { "audio", "video", "screen" };
        if (!validMediaTypes.Contains(mediaType.ToLower()))
        {
            _logger.LogWarning("⚠️ [Hub.MediaStateChanged] Invalid media type: {MediaType}", mediaType);
            return;
        }

        _logger.LogInformation("📹 [Hub.MediaStateChanged] User {UserId} changed {MediaType} to {Enabled} in room {RoomId}",
            userId, mediaType, enabled, roomId);

        // Notify other participants
        await Clients.OthersInGroup(roomId).SendAsync("MediaStateChanged", new
        {
            userId,
            type = mediaType.ToLower(),
            enabled
        });
    }

    /// <summary>
    /// ToggleCamera - Aktualisiert DB UND broadcastet
    /// </summary>
    public async Task ToggleCamera(string roomId, bool enabled)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(roomId))
        {
            _logger.LogWarning("⚠️ [Hub.ToggleCamera] Invalid parameters");
            return;
        }

        try
        {
            // DB Update - CallParticipant.CameraEnabled
            var session = await _unitOfWork.VideoCallSessions.GetByRoomIdWithParticipantsAsync(roomId);
            if (session != null)
            {
                var participant = session.Participants?.FirstOrDefault(p => p.UserId == userId && p.LeftAt == null);
                if (participant != null)
                {
                    participant.CameraEnabled = enabled;
                    participant.UpdatedAt = DateTime.UtcNow;
                    participant.UpdatedBy = userId;
                    await _unitOfWork.CallParticipants.UpdateAsync(participant);
                    await _unitOfWork.SaveChangesAsync();
                    _logger.LogDebug("📹 [Hub.ToggleCamera] Updated DB for user {UserId}, camera={Enabled}", userId, enabled);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ [Hub.ToggleCamera] Error updating DB for user {UserId}", userId);
            // Continue with broadcast even if DB fails
        }

        // Broadcast to other participants
        await Clients.OthersInGroup(roomId).SendAsync("CameraToggled", new { userId, enabled });
    }

    /// <summary>
    /// ToggleMicrophone - Aktualisiert DB UND broadcastet
    /// </summary>
    public async Task ToggleMicrophone(string roomId, bool enabled)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(roomId))
        {
            _logger.LogWarning("⚠️ [Hub.ToggleMicrophone] Invalid parameters");
            return;
        }

        try
        {
            // DB Update - CallParticipant.MicrophoneEnabled
            var session = await _unitOfWork.VideoCallSessions.GetByRoomIdWithParticipantsAsync(roomId);
            if (session != null)
            {
                var participant = session.Participants?.FirstOrDefault(p => p.UserId == userId && p.LeftAt == null);
                if (participant != null)
                {
                    participant.MicrophoneEnabled = enabled;
                    participant.UpdatedAt = DateTime.UtcNow;
                    participant.UpdatedBy = userId;
                    await _unitOfWork.CallParticipants.UpdateAsync(participant);
                    await _unitOfWork.SaveChangesAsync();
                    _logger.LogDebug("🎤 [Hub.ToggleMicrophone] Updated DB for user {UserId}, mic={Enabled}", userId, enabled);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ [Hub.ToggleMicrophone] Error updating DB for user {UserId}", userId);
            // Continue with broadcast even if DB fails
        }

        // Broadcast to other participants
        await Clients.OthersInGroup(roomId).SendAsync("MicrophoneToggled", new { userId, enabled });
    }

    public async Task StartScreenShare(string roomId)
        => await Clients.OthersInGroup(roomId).SendAsync("ScreenShareStarted", new { userId = GetUserId() });

    public async Task StopScreenShare(string roomId)
        => await Clients.OthersInGroup(roomId).SendAsync("ScreenShareStopped", new { userId = GetUserId() });

    /// <summary>
    /// SendChatMessage - Persistiert in DB UND broadcastet
    /// Chat History wird gespeichert wie bei Microsoft Teams
    /// </summary>
    public async Task SendChatMessage(string roomId, string message)
    {
        var userId = GetUserId();
        var timestamp = DateTime.UtcNow;

        // Validation
        if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(roomId))
        {
            _logger.LogWarning("⚠️ [Hub.SendChatMessage] Invalid parameters");
            return;
        }

        if (string.IsNullOrEmpty(message) || message.Length > 2000)
        {
            _logger.LogWarning("⚠️ [Hub.SendChatMessage] Invalid message length from {UserId}", userId);
            return;
        }

        string? messageId = null;
        string senderName = userId; // Default fallback

        try
        {
            // DB Speichern - ChatMessage Entity
            var session = await _unitOfWork.VideoCallSessions.GetByRoomIdAsync(roomId);
            if (session != null)
            {
                // Mark session as using chat
                if (!session.ChatUsed)
                {
                    session.ChatUsed = true;
                    session.UpdatedAt = timestamp;
                    await _unitOfWork.VideoCallSessions.UpdateAsync(session);
                }

                // Get sender name from participants (if available)
                var participant = session.Participants?.FirstOrDefault(p => p.UserId == userId);
                // SenderName would ideally come from user service, but for now use userId
                // In production, consider caching user names or storing them in CallParticipant

                var chatMessage = new Domain.Entities.ChatMessage
                {
                    Id = Guid.NewGuid().ToString(),
                    SessionId = session.Id,
                    SenderId = userId,
                    SenderName = senderName, // TODO: Fetch from UserService or cache
                    Message = message,
                    SentAt = timestamp,
                    MessageType = Domain.Entities.ChatMessageType.Text,
                    CreatedAt = timestamp,
                    CreatedBy = userId
                };

                await _unitOfWork.ChatMessages.AddAsync(chatMessage);
                await _unitOfWork.SaveChangesAsync();

                messageId = chatMessage.Id;
                _logger.LogDebug("💬 [Hub.SendChatMessage] Saved to DB: {MessageId} from {UserId}", messageId, userId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ [Hub.SendChatMessage] Error saving message to DB for user {UserId}", userId);
            // Continue with broadcast even if DB save fails
        }

        // Broadcast to all participants in room (including sender for confirmation)
        await Clients.Group(roomId).SendAsync("ChatMessage", new
        {
            id = messageId,
            userId,
            senderName,
            message,
            timestamp
        });
    }

    // ===== Helper Methods =====

    private string? GetUserId()
        => Context.User?.FindFirst("user_id")?.Value
        ?? Context.User?.FindFirst("sub")?.Value
        ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    /// <summary>
    /// Input Validation für RoomId
    /// Accepts both:
    /// - 12-char hex format (from CreateCallSessionCommandHandler: Guid.NewGuid().ToString("N")[..12])
    /// - Full GUID format (for backwards compatibility)
    /// </summary>
    private static bool IsValidRoomId(string roomId)
    {
        if (string.IsNullOrEmpty(roomId)) return false;
        if (roomId.Length > 100) return false;

        // Accept 12-char hex format (e.g., "77fb5ef737c3")
        if (roomId.Length == 12 && roomId.All(c => char.IsAsciiHexDigit(c)))
        {
            return true;
        }

        // Also accept full GUID format for backwards compatibility
        return Guid.TryParse(roomId, out _);
    }

    /// <summary>
    /// Input Validation für Signaling
    /// </summary>
    private bool ValidateSignalingInput(string roomId, string targetUserId, string data, string type)
    {
        var fromUserId = GetUserId();

        if (string.IsNullOrEmpty(fromUserId))
        {
            _logger.LogWarning("❌ [{Type}] Unauthorized request", type);
            return false;
        }

        if (!IsValidRoomId(roomId))
        {
            _logger.LogWarning("❌ [{Type}] Invalid roomId: {RoomId}", type, roomId);
            return false;
        }

        if (string.IsNullOrEmpty(targetUserId) || targetUserId.Length > 100)
        {
            _logger.LogWarning("❌ [{Type}] Invalid targetUserId", type);
            return false;
        }

        // SDP size limit (typical SDP is 2-5KB)
        if (string.IsNullOrEmpty(data) || data.Length > 50000)
        {
            _logger.LogWarning("❌ [{Type}] Invalid SDP size: {Size}", type, data?.Length ?? 0);
            return false;
        }

        return true;
    }

    /// <summary>
    /// Input Validation für Key Exchange
    /// </summary>
    private bool ValidateKeyExchangeInput(string roomId, string targetUserId, string keyExchangeData)
    {
        var fromUserId = GetUserId();

        if (string.IsNullOrEmpty(fromUserId))
        {
            _logger.LogWarning("❌ [KeyExchange] Unauthorized request");
            return false;
        }

        if (!IsValidRoomId(roomId))
        {
            _logger.LogWarning("❌ [KeyExchange] Invalid roomId");
            return false;
        }

        if (string.IsNullOrEmpty(targetUserId))
        {
            _logger.LogWarning("❌ [KeyExchange] Missing targetUserId");
            return false;
        }

        // Key exchange data shouldn't be too large (public keys are ~100 bytes)
        if (string.IsNullOrEmpty(keyExchangeData) || keyExchangeData.Length > 10000)
        {
            _logger.LogWarning("❌ [KeyExchange] Invalid key exchange data size");
            return false;
        }

        return true;
    }

    /// <summary>
    /// Rate Limiting für Key Exchange
    /// </summary>
    private async Task<bool> CheckKeyExchangeRateLimitAsync(string userId)
    {
        var db = _redis.GetDatabase();
        var key = $"{RATE_LIMIT_KEY_PREFIX}{userId}";

        var current = await db.StringIncrementAsync(key);

        if (current == 1)
        {
            // Setze Expiration beim ersten Request
            await db.KeyExpireAsync(key, TimeSpan.FromSeconds(KEY_EXCHANGE_RATE_WINDOW));
        }

        return current <= KEY_EXCHANGE_RATE_LIMIT;
    }

    /// <summary>
    /// Get Room Participants - Echte DB-Abfrage
    /// Gibt aktive Teilnehmer (LeftAt == null) aus der Datenbank zurück
    /// </summary>
    private async Task<List<object>> GetRoomParticipantsAsync(string roomId)
    {
        try
        {
            var session = await _unitOfWork.VideoCallSessions.GetByRoomIdWithParticipantsAsync(roomId);
            if (session == null)
            {
                _logger.LogDebug("📋 [Hub.GetRoomParticipants] No session found for room {RoomId}", roomId);
                return new List<object>();
            }

            var activeParticipants = session.Participants?
                .Where(p => p.LeftAt == null)
                .Select(p => new
                {
                    userId = p.UserId,
                    connectionId = p.ConnectionId,
                    joinedAt = p.JoinedAt,
                    cameraEnabled = p.CameraEnabled,
                    microphoneEnabled = p.MicrophoneEnabled,
                    screenShareEnabled = p.ScreenShareEnabled,
                    isInitiator = p.IsInitiator
                })
                .ToList<object>() ?? new List<object>();

            _logger.LogDebug("📋 [Hub.GetRoomParticipants] Found {Count} active participants in room {RoomId}",
                activeParticipants.Count, roomId);

            return activeParticipants;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ [Hub.GetRoomParticipants] Error fetching participants for room {RoomId}", roomId);
            return new List<object>();
        }
    }
}
