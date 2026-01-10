using CQRS.Handlers;
using CQRS.Models;
using Contracts.Payment.Responses;
using Microsoft.Extensions.Logging;
using PaymentService.Application.Queries;
using PaymentService.Domain.Repositories;

namespace PaymentService.Application.QueryHandlers;

public class GetPaymentProductsQueryHandler(
    IPaymentUnitOfWork unitOfWork,
    ILogger<GetPaymentProductsQueryHandler> logger)
    : BaseQueryHandler<GetPaymentProductsQuery, List<PaymentProductResponse>>(logger)
{
    private readonly IPaymentUnitOfWork _unitOfWork = unitOfWork;

    public override async Task<ApiResponse<List<PaymentProductResponse>>> Handle(
        GetPaymentProductsQuery request,
        CancellationToken cancellationToken)
    {
        Logger.LogInformation("Getting payment products, type filter: {ProductType}",
            request.ProductType ?? "none");

        var products = string.IsNullOrEmpty(request.ProductType)
            ? await _unitOfWork.PaymentProducts.GetAllActiveAsync(cancellationToken)
            : await _unitOfWork.PaymentProducts.GetActiveByTypeAsync(request.ProductType, cancellationToken);

        var responses = products
            .OrderBy(p => p.SortOrder)
            .Select(p => new PaymentProductResponse(
                p.Id,
                p.Name,
                p.Description,
                p.ProductType,
                p.BoostType,
                p.Price,
                p.Currency,
                p.DurationDays))
            .ToList();

        Logger.LogInformation("Found {Count} payment products", responses.Count);

        return Success(responses);
    }
}
