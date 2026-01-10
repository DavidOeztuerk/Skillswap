using CQRS.Interfaces;
using Contracts.Payment.Responses;

namespace PaymentService.Application.Queries;

public record GetPaymentProductsQuery(string? ProductType = null)
    : IQuery<List<PaymentProductResponse>>, ICacheableQuery
{
    public string CacheKey => $"payment-products:{ProductType ?? "all"}";
    public TimeSpan CacheDuration => TimeSpan.FromMinutes(30);
}
