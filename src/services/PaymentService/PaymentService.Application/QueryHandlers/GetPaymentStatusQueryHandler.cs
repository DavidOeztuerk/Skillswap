using CQRS.Handlers;
using CQRS.Models;
using Contracts.Payment.Responses;
using Microsoft.Extensions.Logging;
using PaymentService.Application.Queries;
using PaymentService.Domain.Entities;
using PaymentService.Domain.Repositories;

namespace PaymentService.Application.QueryHandlers;

public class GetPaymentStatusQueryHandler(
    IPaymentUnitOfWork unitOfWork,
    ILogger<GetPaymentStatusQueryHandler> logger)
    : BaseQueryHandler<GetPaymentStatusQuery, PaymentStatusResponse>(logger)
{
    private readonly IPaymentUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<PaymentStatusResponse>> Handle(
        GetPaymentStatusQuery request,
        CancellationToken cancellationToken)
    {
        Logger.LogInformation("Getting payment status for {PaymentId}", request.PaymentId);

        var payment = await _unitOfWork.Payments.GetByIdAsync(request.PaymentId, cancellationToken);

        if (payment == null)
        {
            return NotFound("Payment not found");
        }

        // Security check: user can only see their own payments
        if (payment.UserId != request.UserId)
        {
            return NotFound("Payment not found");
        }

        var isCompleted = payment.Status == PaymentStatus.Succeeded;

        var response = new PaymentStatusResponse(
            payment.Id,
            payment.Status.ToString(),
            isCompleted,
            payment.CompletedAt);

        return Success(response);
    }
}
