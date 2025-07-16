namespace Events.Analytics;

public record BulkUserOperationEvent(
    string AdminUserId,
    string OperationType,
    List<string> TargetUserIds,
    string Description);
