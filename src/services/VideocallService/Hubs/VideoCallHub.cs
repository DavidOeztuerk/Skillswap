using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;

namespace VideocallService.Hubs;

public class VideoCallHub : Hub
{
    public override Task OnConnectedAsync()
    {
        var userId =
            base.Context.User?.FindFirst(JwtRegisteredClaimNames.Sub)?.Value ??
            base.Context.User?.FindFirst("sub")?.Value ??
            base.Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId))
        {
            Context.Abort();
        }

        return base.OnConnectedAsync();
    }
    public async Task JoinRoom(string roomId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
        await Clients.Group(roomId).SendAsync("UserJoined", Context.ConnectionId);
    }

    public async Task LeaveRoom(string roomId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId);
        await Clients.Group(roomId).SendAsync("UserLeft", Context.ConnectionId);
    }

    public async Task SendOffer(string roomId, string offer)
    {
        await Clients.OthersInGroup(roomId).SendAsync("ReceiveOffer", offer);
    }

    public async Task SendAnswer(string roomId, string answer)
    {
        await Clients.OthersInGroup(roomId).SendAsync("ReceiveAnswer", answer);
    }

    public async Task SendIceCandidate(string roomId, string candidate)
    {
        await Clients.OthersInGroup(roomId).SendAsync("ReceiveIceCandidate", candidate);
    }
}
