namespace AppointmentService.Models;

public class Appointment
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public string ParticipantId { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending";
}