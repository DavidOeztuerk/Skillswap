namespace Events.Security.DataAccess;

public record UserDataExportedEvent(
    string RequestedByUserId,
    string TargetUserId,
    List<string> ExportedDataTypes,
    string ExportFormat);
