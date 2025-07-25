using System.ComponentModel.DataAnnotations;

namespace Contracts.VideoCall.Requests;

/// <summary>
/// API request for CreateCallSession operation
/// </summary>
public record CreateCallSessionRequest(
    [Required(ErrorMessage = "Appointment ID is required")]
    string AppointmentId,

    [Range(2, 50, ErrorMessage = "Participants must be between 2 and 50")]
    int MaxParticipants = 2)
{
    /// <summary>
    /// API Version this request supports
    /// </summary>
    public string ApiVersion => "v1";
}
