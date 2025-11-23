using System.Collections.Concurrent;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using VideocallService.Domain.Entities;
using Events.Domain.VideoCall;
using VideocallService.Domain.Repositories;
using EventSourcing;

namespace VideocallService.Hubs;

[Authorize]
public class VideoCallHub : Hub
{
    private readonly IVideocallUnitOfWork _unitOfWork;
    private readonly IDomainEventPublisher _eventPublisher;
    private readonly ILogger<VideoCallHub> _logger;

    private static readonly ConcurrentDictionary<string, string> _userConnections = new();

    public VideoCallHub(
        IVideocallUnitOfWork unitOfWork,
        IDomainEventPublisher eventPublisher,
        ILogger<VideoCallHub> logger)
    {
        _unitOfWork = unitOfWork;
        _eventPublisher = eventPublisher;
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            _logger.LogWarning("Unauthenticated user tried to connect - aborting");
            Context.Abort();
            return;
        }

        _userConnections[userId] = Context.ConnectionId;

        var roomId = Context.GetHttpContext()?.Request.Query["roomId"].ToString();
        if (!string.IsNullOrEmpty(roomId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, roomId);

            // 🔥 KORREKTUR: Sende UserJoined mit korrekter Struktur
            await Clients.OthersInGroup(roomId).SendAsync("UserJoined", new
            {
                userId = userId
            });

            _logger.LogInformation("User {UserId} joined room {RoomId}", userId, roomId);
        }

        await base.OnConnectedAsync();
    }

    // 🔥 KORREKTUR: SendOffer mit besserem Error Handling
    public async Task SendOffer(string roomId, string targetUserId, string sdp)
    {
        var fromUserId = GetUserId();
        _logger.LogInformation("📤 [Hub.SendOffer] From {FromUser} to {TargetUser} in room {RoomId}", 
            fromUserId, targetUserId, roomId);

        try
        {
            if (_userConnections.TryGetValue(targetUserId, out var targetConnectionId))
            {
                await Clients.Client(targetConnectionId).SendAsync("ReceiveOffer", new
                {
                    fromUserId = fromUserId,
                    offer = sdp
                });
                _logger.LogInformation("✅ [Hub.SendOffer] Sent directly to {TargetUser}", targetUserId);
            }
            else
            {
                await Clients.OthersInGroup(roomId).SendAsync("ReceiveOffer", new
                {
                    fromUserId = fromUserId,
                    offer = sdp
                });
                _logger.LogWarning("⚠️ [Hub.SendOffer] Target user {TargetUser} not found, broadcasting", targetUserId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ [Hub.SendOffer] Error sending offer from {FromUser} to {TargetUser}", 
                fromUserId, targetUserId);
            throw new HubException($"Failed to send offer: {ex.Message}");
        }
    }

    // 🔥 KORREKTUR: SendAnswer mit gleichem Pattern
    public async Task SendAnswer(string roomId, string targetUserId, string sdp)
    {
        var fromUserId = GetUserId();
        _logger.LogInformation("📤 [Hub.SendAnswer] From {FromUser} to {TargetUser} in room {RoomId}", 
            fromUserId, targetUserId, roomId);

        try
        {
            if (_userConnections.TryGetValue(targetUserId, out var targetConnectionId))
            {
                await Clients.Client(targetConnectionId).SendAsync("ReceiveAnswer", new
                {
                    fromUserId = fromUserId,
                    answer = sdp
                });
                _logger.LogInformation("✅ [Hub.SendAnswer] Sent directly to {TargetUser}", targetUserId);
            }
            else
            {
                await Clients.OthersInGroup(roomId).SendAsync("ReceiveAnswer", new
                {
                    fromUserId = fromUserId,
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

    // 🔥 KORREKTUR: SendIceCandidate mit besserem Error Handling
    public async Task SendIceCandidate(string roomId, string targetUserId, string candidate)
    {
        var fromUserId = GetUserId();
        
        try
        {
            if (_userConnections.TryGetValue(targetUserId, out var targetConnectionId))
            {
                await Clients.Client(targetConnectionId).SendAsync("ReceiveIceCandidate", new
                {
                    fromUserId = fromUserId,
                    candidate = candidate
                });
            }
            else
            {
                await Clients.OthersInGroup(roomId).SendAsync("ReceiveIceCandidate", new
                {
                    fromUserId = fromUserId,
                    candidate = candidate
                });
            }
            
            _logger.LogDebug("🧊 [Hub.SendIceCandidate] Sent from {FromUser} to {TargetUser}", fromUserId, targetUserId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ [Hub.SendIceCandidate] Error sending ICE candidate from {FromUser} to {TargetUser}", 
                fromUserId, targetUserId);
            // Don't throw here - ICE candidates are not critical
        }
    }

    /// <summary>
    /// Handles SignalR disconnection.
    /// IMPORTANT: DB persistence is handled by /leave API endpoint (LeaveCallCommandHandler).
    /// This method only handles SignalR cleanup (broadcast, group removal).
    /// </summary>
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();
        if (!string.IsNullOrEmpty(userId))
        {
            // Remove from in-memory connection tracking
            _userConnections.TryRemove(userId, out _);

            var roomId = Context.GetHttpContext()?.Request.Query["roomId"].ToString();
            if (!string.IsNullOrEmpty(roomId))
            {
                // Broadcast to other participants that user left
                await Clients.Group(roomId).SendAsync("UserLeft", new { userId });

                // Remove from SignalR group
                await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId);

                _logger.LogInformation("User {UserId} disconnected from room {RoomId}. " +
                    "DB persistence handled by /leave API endpoint.", userId, roomId);
            }
            else
            {
                _logger.LogInformation("User {UserId} disconnected (no room)", userId);
            }
        }

        await base.OnDisconnectedAsync(exception);
    }

    public async Task JoinRoom(string roomId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return;

        await Groups.AddToGroupAsync(Context.ConnectionId, roomId);

        var participants = _userConnections.Keys.ToList();

        await Clients.Caller.SendAsync("RoomJoined", new { roomId, participants });
        _logger.LogInformation("✅ [Hub.JoinRoom] User {UserId} joined room {RoomId}", userId, roomId);
    }

    // Restliche Methoden unverändert...
    /// <summary>
    /// DEPRECATED: Use /api/calls/start API endpoint instead.
    /// Kept for backward compatibility but logs warning.
    /// Hub should only handle signaling, not business logic.
    /// </summary>
    [Obsolete("Use POST /api/calls/start endpoint instead")]
    public async Task StartCall(string sessionId)
    {
        _logger.LogWarning("⚠️ [Hub.StartCall] DEPRECATED method called for session {SessionId}. " +
            "This should be done via POST /api/calls/start endpoint. " +
            "Hub should only handle signaling, not business logic.", sessionId);

        try
        {
            // For backward compatibility, just broadcast the event
            // Actual DB update should be done via API endpoint
            var roomId = Context.GetHttpContext()?.Request.Query["roomId"].ToString();
            if (!string.IsNullOrEmpty(roomId))
            {
                await Clients.Group(roomId).SendAsync("CallStarted", sessionId);
                _logger.LogInformation("✅ [Hub.StartCall] Broadcasted CallStarted for session {SessionId}", sessionId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ [Hub.StartCall] Error broadcasting CallStarted for session {SessionId}", sessionId);
            throw new HubException($"Failed to start call: {ex.Message}");
        }
    }

    public async Task SendSignal(string roomId, string targetUserId, object signal)
    {
        var fromUserId = GetUserId();
        if (string.IsNullOrEmpty(fromUserId)) return;

        if (!string.IsNullOrEmpty(targetUserId) && _userConnections.TryGetValue(targetUserId, out var targetConnectionId))
        {
            await Clients.Client(targetConnectionId).SendAsync("ReceiveSignal", new
            {
                fromUserId = fromUserId,
                signal
            });
            return;
        }

        await Clients.Group(roomId).SendAsync("ReceiveSignal", new
        {
            fromUserId = fromUserId,
            signal
        });
    }

    public async Task ToggleCamera(string roomId, bool enabled)
        => await Clients.OthersInGroup(roomId).SendAsync("CameraToggled", new { userId = GetUserId(), enabled });

    public async Task ToggleMicrophone(string roomId, bool enabled)
        => await Clients.OthersInGroup(roomId).SendAsync("MicrophoneToggled", new { userId = GetUserId(), enabled });

    public async Task StartScreenShare(string roomId)
        => await Clients.OthersInGroup(roomId).SendAsync("ScreenShareStarted", new { userId = GetUserId() });

    public async Task StopScreenShare(string roomId)
        => await Clients.OthersInGroup(roomId).SendAsync("ScreenShareStopped", new { userId = GetUserId() });

    public async Task SendChatMessage(string roomId, string message)
        => await Clients.Group(roomId).SendAsync("ChatMessage", new
        {
            userId = GetUserId(),
            message,
            timestamp = DateTime.UtcNow
        });

    /// <summary>
    /// PHASE 2.3: Heartbeat handler
    /// Frontend sends this every 30 seconds to prove it's still alive
    /// BackgroundService uses this to detect zombie participants
    /// </summary>
    public async Task SendHeartbeat(string sessionId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(sessionId))
        {
            _logger.LogWarning("⚠️ [Hub.SendHeartbeat] Invalid heartbeat - userId or sessionId missing");
            return;
        }

        // Just acknowledge - the cleanup service will check UpdatedAt timestamps
        // No need to update DB here, that would create too much load
        _logger.LogDebug("💓 [Hub.SendHeartbeat] Heartbeat from user {UserId} in session {SessionId}",
            userId, sessionId);

        // Send ACK back to client
        await Clients.Caller.SendAsync("HeartbeatAck", new { timestamp = DateTime.UtcNow });
    }

    private string? GetUserId()
        => Context.User?.FindFirst("user_id")?.Value
        ?? Context.User?.FindFirst("sub")?.Value
        ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
}