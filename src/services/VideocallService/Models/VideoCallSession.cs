namespace VideocallService.Models;

public class VideoCallSession
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string RoomId { get; set; } = string.Empty;
    public string CreatorId { get; set; } = string.Empty;
    public string ParticipantId { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}
