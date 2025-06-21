using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace VideocallService.Hubs;

[Authorize]
public class VideoCallHub(
    VideoCallDbContext dbContext,
    ILogger<VideoCallHub> logger) : Hub
{
    private readonly VideoCallDbContext _dbContext = dbContext;
    private readonly ILogger<VideoCallHub> _logger = logger;

    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            Context.Abort();
            return;
        }

        _logger.LogInformation("User {UserId} connected to VideoCall hub with connection {ConnectionId}",
            userId, Context.ConnectionId);

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();
        if (!string.IsNullOrEmpty(userId))
        {
            // Find and leave any active sessions
            var activeSessions = await _dbContext.VideoCallSessions
                .Where(s => s.ConnectedUserIds.Contains(userId) && s.IsActive)
                .ToListAsync();

            foreach (var session in activeSessions)
            {
                await LeaveRoomInternal(session.RoomId, userId);
            }

            _logger.LogInformation("User {UserId} disconnected from VideoCall hub", userId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    public async Task JoinRoom(string roomId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return;

        try
        {
            var session = await _dbContext.VideoCallSessions
                .FirstOrDefaultAsync(s => s.RoomId == roomId && !s.IsDeleted);

            if (session == null)
            {
                await Clients.Caller.SendAsync("Error", "Room not found");
                return;
            }

            if (session.InitiatorUserId != userId && session.ParticipantUserId != userId)
            {
                await Clients.Caller.SendAsync("Error", "Unauthorized to join this room");
                return;
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
            session.AddParticipant(userId, Context.ConnectionId);

            await _dbContext.SaveChangesAsync();

            // Notify others in the room
            await Clients.OthersInGroup(roomId).SendAsync("UserJoined", new
            {
                UserId = userId,
                ConnectionId = Context.ConnectionId
            });

            // Send current participants to the joining user
            await Clients.Caller.SendAsync("RoomJoined", new
            {
                RoomId = roomId,
                Participants = session.ConnectedUserIds.Where(id => id != userId).ToList()
            });

            _logger.LogInformation("User {UserId} joined room {RoomId}", userId, roomId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error joining room {RoomId} for user {UserId}", roomId, userId);
            await Clients.Caller.SendAsync("Error", "Failed to join room");
        }
    }

    public async Task LeaveRoom(string roomId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return;

        await LeaveRoomInternal(roomId, userId);
    }

    private async Task LeaveRoomInternal(string roomId, string userId)
    {
        try
        {
            var session = await _dbContext.VideoCallSessions
                .Include(s => s.Participants)
                .FirstOrDefaultAsync(s => s.RoomId == roomId && !s.IsDeleted);

            if (session != null)
            {
                session.RemoveParticipant(userId);

                // Update participant record
                var participant = session.Participants
                    .FirstOrDefault(p => p.UserId == userId && p.LeftAt == null);
                
                if (participant != null)
                {
                    participant.LeftAt = DateTime.UtcNow;
                }

                // End session if no participants left
                if (session.ParticipantCount == 0 && session.IsActive)
                {
                    session.End("All participants left");
                }

                await _dbContext.SaveChangesAsync();

                await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId);
                await Clients.OthersInGroup(roomId).SendAsync("UserLeft", new { UserId = userId });

                _logger.LogInformation("User {UserId} left room {RoomId}", userId, roomId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error leaving room {RoomId} for user {UserId}", roomId, userId);
        }
    }

    public async Task SendOffer(string roomId, string targetUserId, string offer)
    {
        var userId = GetUserId();
        await Clients.Group(roomId).SendAsync("ReceiveOffer", new
        {
            FromUserId = userId,
            TargetUserId = targetUserId,
            Offer = offer
        });
    }

    public async Task SendAnswer(string roomId, string targetUserId, string answer)
    {
        var userId = GetUserId();
        await Clients.Group(roomId).SendAsync("ReceiveAnswer", new
        {
            FromUserId = userId,
            TargetUserId = targetUserId,
            Answer = answer
        });
    }

    public async Task SendIceCandidate(string roomId, string targetUserId, string candidate)
    {
        var userId = GetUserId();
        await Clients.Group(roomId).SendAsync("ReceiveIceCandidate", new
        {
            FromUserId = userId,
            TargetUserId = targetUserId,
            Candidate = candidate
        });
    }

    public async Task ToggleCamera(string roomId, bool enabled)
    {
        var userId = GetUserId();
        await Clients.OthersInGroup(roomId).SendAsync("CameraToggled", new
        {
            UserId = userId,
            Enabled = enabled
        });
    }

    public async Task ToggleMicrophone(string roomId, bool enabled)
    {
        var userId = GetUserId();
        await Clients.OthersInGroup(roomId).SendAsync("MicrophoneToggled", new
        {
            UserId = userId,
            Enabled = enabled
        });
    }

    public async Task StartScreenShare(string roomId)
    {
        var userId = GetUserId();
        await Clients.OthersInGroup(roomId).SendAsync("ScreenShareStarted", new { UserId = userId });
    }

    public async Task StopScreenShare(string roomId)
    {
        var userId = GetUserId();
        await Clients.OthersInGroup(roomId).SendAsync("ScreenShareStopped", new { UserId = userId });
    }

    public async Task SendChatMessage(string roomId, string message)
    {
        var userId = GetUserId();
        await Clients.Group(roomId).SendAsync("ChatMessage", new
        {
            UserId = userId,
            Message = message,
            Timestamp = DateTime.UtcNow
        });
    }

    private string? GetUserId()
    {
        return Context.User?.FindFirst("user_id")?.Value
               ?? Context.User?.FindFirst("sub")?.Value
               ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    }
}
