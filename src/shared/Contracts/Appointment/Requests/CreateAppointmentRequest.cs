using System.ComponentModel.DataAnnotations;

namespace Contracts.Appointment.Requests;

/// <summary>
/// API request for creating a new appointment
/// </summary>
/// <param name="Title">Title of the appointment</param>
/// <param name="Description">Optional description of the appointment</param>
/// <param name="ScheduledDate">Scheduled date and time for the appointment</param>
/// <param name="DurationMinutes">Duration of the appointment in minutes</param>
/// <param name="ParticipantUserId">ID of the user who will participate in the appointment</param>
/// <param name="SkillId">Optional ID of the skill related to this appointment</param>
/// <param name="MatchId">Optional ID of the match this appointment is for</param>
/// <param name="MeetingType">Type of meeting (VideoCall, InPerson, Phone, Online)</param>
public record CreateAppointmentRequest(
    [Required(ErrorMessage = "Title is required")]
    [StringLength(200, MinimumLength = 3, ErrorMessage = "Title must be between 3 and 200 characters")]
    string Title,

    [StringLength(2000, ErrorMessage = "Description must not exceed 2000 characters")]
    string? Description,

    [Required(ErrorMessage = "Scheduled date is required")]
    DateTime ScheduledDate,

    [Required(ErrorMessage = "Duration is required")]
    [Range(1, 480, ErrorMessage = "Duration must be between 1 and 480 minutes")]
    int DurationMinutes,

    [Required(ErrorMessage = "Participant user ID is required")]
    string ParticipantUserId,

    string? SkillId = null,

    string? MatchId = null,

    [Required(ErrorMessage = "Meeting type is required")]
    [RegularExpression("^(VideoCall|InPerson|Phone|Online)$", ErrorMessage = "Meeting type must be VideoCall, InPerson, Phone, or Online")]
    string? MeetingType = "VideoCall")
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
