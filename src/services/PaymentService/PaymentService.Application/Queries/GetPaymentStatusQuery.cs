using CQRS.Interfaces;
using Contracts.Payment.Responses;

namespace PaymentService.Application.Queries;

public record GetPaymentStatusQuery(
    string PaymentId,
    string UserId)
    : IQuery<PaymentStatusResponse>;
