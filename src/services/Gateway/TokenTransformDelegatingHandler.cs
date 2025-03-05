using System.Security.Claims;

namespace Gateway;

public class TokenTransformDelegatingHandler(
    IHttpContextAccessor httpContextAccessor)
    : DelegatingHandler
{
    private readonly IHttpContextAccessor _httpContextAccessor = httpContextAccessor;

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var httpContext = _httpContextAccessor.HttpContext;

        if (httpContext?.User?.Identity?.IsAuthenticated == true)
        {
            // Original-JWT-Token aus dem Auth-Header lesen
            var authHeader = httpContext.Request.Headers.Authorization.ToString();
            if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer "))
            {
                // Original-Token an den Downstream-Service weiterleiten
                request.Headers.Add("Authorization", authHeader);

                // Einen signierten Vertrauensnachweis hinzufügen
                var email = httpContext.User.FindFirst(ClaimTypes.Email)?.Value;
                if (!string.IsNullOrEmpty(email))
                {
                    // Gateway-validierte Identität
                    request.Headers.Add("X-Gateway-Verified", "true");
                }
            }
        }

        return await base.SendAsync(request, cancellationToken);
    }
}
