using System.ComponentModel.DataAnnotations;

namespace Contracts.User.Requests;

public record GenerateServiceTokenRequest(
    [Required(ErrorMessage = "Service name is required")]
    string ServiceName,

    [Required(ErrorMessage = "Service password is required")]
    string ServicePassword
);
