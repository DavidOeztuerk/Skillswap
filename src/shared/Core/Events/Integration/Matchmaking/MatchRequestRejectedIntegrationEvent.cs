namespace Events.Integration.Matchmaking;

public record MatchRequestRejectedIntegrationEvent
{
    public string RequestId { get; init; }
    public string RequesterId { get; init; }
    public string RequesterName { get; init; }
    public string TargetUserId { get; init; }
    public string TargetUserName { get; init; }
    public string SkillId { get; init; }
    public string SkillName { get; init; }
    public string? RejectionReason { get; init; }
    public string ThreadId { get; init; }
    public DateTime RejectedAt { get; init; }

    public MatchRequestRejectedIntegrationEvent(
        string requestId,
        string requesterId,
        string requesterName,
        string targetUserId,
        string targetUserName,
        string skillId,
        string skillName,
        string? rejectionReason,
        string threadId,
        DateTime rejectedAt)
    {
        RequestId = requestId;
        RequesterId = requesterId;
        RequesterName = requesterName;
        TargetUserId = targetUserId;
        TargetUserName = targetUserName;
        SkillId = skillId;
        SkillName = skillName;
        RejectionReason = rejectionReason;
        ThreadId = threadId;
        RejectedAt = rejectedAt;
    }
}