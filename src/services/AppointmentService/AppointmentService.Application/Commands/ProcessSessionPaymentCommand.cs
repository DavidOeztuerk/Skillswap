using Contracts.Appointment.Responses;
using CQRS.Interfaces;
using FluentValidation;

namespace AppointmentService.Application.Commands;

public record ProcessSessionPaymentCommand(
    string SessionAppointmentId,
    string PayerId,
    string PayeeId,
    decimal Amount,
    string Currency = "EUR",
    string? PaymentMethodToken = null,
    decimal? PlatformFeePercent = null) : ICommand<PaymentResponse>, IAuditableCommand
{
    string? IAuditableCommand.UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class ProcessSessionPaymentCommandValidator : AbstractValidator<ProcessSessionPaymentCommand>
{
    public ProcessSessionPaymentCommandValidator()
    {
        RuleFor(x => x.SessionAppointmentId)
            .NotEmpty().WithMessage("Session Appointment ID is required");

        RuleFor(x => x.PayerId)
            .NotEmpty().WithMessage("Payer ID is required");

        RuleFor(x => x.PayeeId)
            .NotEmpty().WithMessage("Payee ID is required");

        RuleFor(x => x.Amount)
            .GreaterThan(0).WithMessage("Amount must be greater than 0");

        RuleFor(x => x.Currency)
            .NotEmpty().WithMessage("Currency is required")
            .Length(3).WithMessage("Currency must be 3 characters");

        RuleFor(x => x.PaymentMethodToken)
            .NotEmpty().WithMessage("Payment method token is required");
    }
}
