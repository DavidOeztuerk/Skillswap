namespace Events.Integration.SkillManagement;

public record SkillExportCompletedEvent(
    string UserId,
    string ExportId,
    string Format,
    DateTime CompletedAt,
    int TotalSkills,
    string FileName,
    bool Success = true,
    string? ErrorMessage = null
);
