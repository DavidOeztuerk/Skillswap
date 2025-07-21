namespace Events.Integration.SkillManagement;

public record SkillExportRequestedEvent(
    string UserId,
    string ExportId,
    string Format,
    DateTime RequestedAt,
    Dictionary<string, object> ExportOptions
);
