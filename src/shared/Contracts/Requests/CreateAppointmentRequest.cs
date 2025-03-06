namespace Contracts.Requests;

public record CreateAppointmentRequest(
    string Title,
    string Description,
    DateTime Date,
    string SkillCreatorId);