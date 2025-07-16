namespace Events.Security.DataAccess;

public record UserDataDeletedEvent(
    string DeletedByUserId,
    string TargetUserId,
    List<string> DeletedDataTypes,
    string DeleteReason);
