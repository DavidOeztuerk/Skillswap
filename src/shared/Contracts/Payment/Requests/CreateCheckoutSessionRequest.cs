using System.ComponentModel.DataAnnotations;

namespace Contracts.Payment.Requests;

public record CreateCheckoutSessionRequest(
    [Required(ErrorMessage = "Product ID is required")]
    string ProductId,

    string? ReferenceId,
    string? ReferenceType,

    [Required(ErrorMessage = "Success URL is required")]
    string SuccessUrl,

    [Required(ErrorMessage = "Cancel URL is required")]
    string CancelUrl);
