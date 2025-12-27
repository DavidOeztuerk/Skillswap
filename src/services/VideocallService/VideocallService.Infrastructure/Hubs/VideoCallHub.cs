using System.Diagnostics;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using VideocallService.Application.DTOs;
using VideocallService.Domain.Entities;
using VideocallService.Domain.Repositories;
using VideocallService.Domain.Services;
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
public class VideoCallHub(
    IVideocallUnitOfWork unitOfWork,
    IDomainEventPublisher eventPublisher,
    ILogger<VideoCallHub> logger,
    IConnectionMultiplexer redis,
    IE2EERateLimiter rateLimiter) : Hub
{
  private readonly IVideocallUnitOfWork _unitOfWork = unitOfWork;
  private readonly IDomainEventPublisher _eventPublisher = eventPublisher;
  private readonly ILogger<VideoCallHub> _logger = logger;
  private readonly IConnectionMultiplexer _redis = redis;
  private readonly IE2EERateLimiter _rateLimiter = rateLimiter;

  private const string USER_CONNECTIONS_KEY = "videocall:connections";
  private const int MAX_E2EE_PAYLOAD_SIZE = 10000; // 10KB max for E2EE payloads

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

  // ===== E2EE Key Exchange Methods (NEW UNIFIED API) =====

  /// <summary>
  /// Unified E2EE Message Forwarding
  /// Replaces separate SendKeyOffer/SendKeyAnswer/SendKeyRotation methods
  ///
  /// Features:
  /// - Sliding window rate limiting
  /// - Audit logging (metadata only!)
  /// - Typed message handling
  /// - Consistent error responses
  /// </summary>
  public async Task<E2EEOperationResult> ForwardE2EEMessage(E2EEMessageDto message)
  {
    var stopwatch = Stopwatch.StartNew();
    var fromUserId = GetUserId();

    // Validate sender
    if (string.IsNullOrEmpty(fromUserId))
    {
      return E2EEOperationResult.Fail(E2EEErrorCodes.Unauthorized, "User not authenticated");
    }

    // Validate message
    var validationResult = ValidateE2EEMessage(message);
    if (!validationResult.Success)
    {
      await LogE2EEOperationAsync(message, fromUserId, false, stopwatch.ElapsedMilliseconds,
          validationResult.ErrorCode);
      return validationResult;
    }

    // Check rate limit using sliding window
    var rateLimitResult = await _rateLimiter.CheckRateLimitAsync(fromUserId, message.Type.ToString());
    if (!rateLimitResult.IsAllowed)
    {
      await LogE2EEOperationAsync(message, fromUserId, false, stopwatch.ElapsedMilliseconds,
          E2EEErrorCodes.RateLimitExceeded, wasRateLimited: true);

      _logger.LogWarning(
          "E2EE rate limit exceeded for {UserId}: {Current}/{Max}, reset in {ResetIn}s",
          fromUserId, rateLimitResult.CurrentCount, rateLimitResult.MaxOperations,
          rateLimitResult.ResetInSeconds);

      return E2EEOperationResult.Fail(
          E2EEErrorCodes.RateLimitExceeded,
          $"Rate limit exceeded. Try again in {rateLimitResult.ResetInSeconds} seconds.");
    }

    // Record the operation for rate limiting
    await _rateLimiter.RecordOperationAsync(fromUserId, message.Type.ToString());

    try
    {
      var db = _redis.GetDatabase();
      var targetConnectionId = await db.HashGetAsync(USER_CONNECTIONS_KEY, message.TargetUserId);

      // Determine the SignalR event name based on message type
      var eventName = GetE2EEEventName(message.Type);

      // Forward the message - send as (fromUserId, payload) to match frontend expectations
      if (targetConnectionId.HasValue)
      {
        await Clients.Client(targetConnectionId.ToString()).SendAsync(eventName,
            fromUserId,
            message.EncryptedPayload);

        _logger.LogInformation(
            "E2EE {Type} sent from {FromUser} to {TargetUser} (direct)",
            message.Type, fromUserId, message.TargetUserId);
      }
      else
      {
        // Fallback to group broadcast if target not found in Redis
        await Clients.OthersInGroup(message.RoomId).SendAsync(eventName,
            fromUserId,
            message.EncryptedPayload);

        _logger.LogWarning(
            "E2EE {Type} broadcast from {FromUser} (target {TargetUser} not in Redis)",
            message.Type, fromUserId, message.TargetUserId);
      }

      // Log successful operation
      await LogE2EEOperationAsync(message, fromUserId, true, stopwatch.ElapsedMilliseconds);

      return E2EEOperationResult.Ok();
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Error forwarding E2EE message from {FromUser} to {TargetUser}",
          fromUserId, message.TargetUserId);

      await LogE2EEOperationAsync(message, fromUserId, false, stopwatch.ElapsedMilliseconds,
          "INTERNAL_ERROR");

      throw new HubException($"Failed to forward E2EE message: {ex.Message}");
    }
  }

  /// <summary>
  /// Validates an E2EE message
  /// </summary>
  private E2EEOperationResult ValidateE2EEMessage(E2EEMessageDto message)
  {
    if (!IsValidRoomId(message.RoomId))
    {
      return E2EEOperationResult.Fail(E2EEErrorCodes.InvalidRoom, "Invalid room ID format");
    }

    if (string.IsNullOrEmpty(message.TargetUserId) || message.TargetUserId.Length > 100)
    {
      return E2EEOperationResult.Fail(E2EEErrorCodes.InvalidTarget, "Invalid target user ID");
    }

    if (string.IsNullOrEmpty(message.EncryptedPayload))
    {
      return E2EEOperationResult.Fail(E2EEErrorCodes.InvalidPayload, "Payload is required");
    }

    if (message.EncryptedPayload.Length > MAX_E2EE_PAYLOAD_SIZE)
    {
      return E2EEOperationResult.Fail(E2EEErrorCodes.MessageTooLarge,
          $"Payload exceeds maximum size of {MAX_E2EE_PAYLOAD_SIZE} bytes");
    }

    return E2EEOperationResult.Ok();
  }

  /// <summary>
  /// Gets the SignalR event name for an E2EE message type
  /// </summary>
  private static string GetE2EEEventName(E2EEMessageType type) => type switch
  {
    E2EEMessageType.KeyOffer => "ReceiveKeyOffer",
    E2EEMessageType.KeyAnswer => "ReceiveKeyAnswer",
    E2EEMessageType.KeyRotation => "ReceiveKeyRotation",
    E2EEMessageType.KeyConfirmation => "ReceiveE2EEMessage",
    E2EEMessageType.KeyRejection => "ReceiveE2EEMessage",
    _ => "ReceiveE2EEMessage"
  };

  /// <summary>
  /// Logs E2EE operations for audit (metadata only, NEVER key content!)
  /// </summary>
  private async Task LogE2EEOperationAsync(
      E2EEMessageDto message,
      string fromUserId,
      bool success,
      long processingTimeMs,
      string? errorCode = null,
      bool wasRateLimited = false)
  {
    try
    {
      var httpContext = Context.GetHttpContext();
      var clientIp = httpContext?.Connection.RemoteIpAddress?.ToString();
      var userAgent = httpContext?.Request.Headers.UserAgent.ToString();

      var auditLog = E2EEAuditLog.Create(
          roomId: message.RoomId,
          fromUserId: fromUserId,
          toUserId: message.TargetUserId,
          messageType: message.Type.ToString(),
          success: success,
          payloadSize: message.EncryptedPayload?.Length ?? 0,
          keyFingerprint: message.KeyFingerprint,
          keyGeneration: message.KeyGeneration,
          errorCode: errorCode,
          clientIpAddress: clientIp,
          userAgent: userAgent,
          clientTimestamp: message.ClientTimestamp
      );

      auditLog.ProcessingTimeMs = (int)processingTimeMs;
      auditLog.WasRateLimited = wasRateLimited;

      // Find session ID if available
      var session = await _unitOfWork.VideoCallSessions.GetByRoomIdAsync(message.RoomId);
      if (session != null)
      {
        auditLog.SessionId = session.Id;
      }

      await _unitOfWork.E2EEAuditLogs.AddAsync(auditLog);
      await _unitOfWork.SaveChangesAsync();
    }
    catch (Exception ex)
    {
      // Don't fail the operation if audit logging fails
      _logger.LogError(ex, "Failed to log E2EE audit entry");
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
  /// [DEPRECATED] Rate Limiting für Key Exchange
  /// Uses the new sliding window rate limiter service
  /// </summary>
  private async Task<bool> CheckKeyExchangeRateLimitAsync(string userId)
  {
    var result = await _rateLimiter.CheckRateLimitAsync(userId, "KeyExchange");
    if (result.IsAllowed)
    {
      await _rateLimiter.RecordOperationAsync(userId, "KeyExchange");
    }
    return result.IsAllowed;
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
