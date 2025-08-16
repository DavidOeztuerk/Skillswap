using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Text.Encodings.Web;

namespace Testing.Helpers;

public class TestAuthenticationSchemeOptions : AuthenticationSchemeOptions
{
    public string DefaultUserId { get; set; } = "test-user-id";
    public string[] DefaultRoles { get; set; } = { "User" };
}

public class TestAuthenticationHandler : AuthenticationHandler<TestAuthenticationSchemeOptions>
{
    public TestAuthenticationHandler(IOptionsMonitor<TestAuthenticationSchemeOptions> options,
        ILoggerFactory logger, UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var claims = new List<Claim>();

        // Check for test headers
        if (Context.Request.Headers.TryGetValue("Test-UserId", out var userId))
        {
            claims.Add(new Claim(ClaimTypes.NameIdentifier, userId.ToString()));
            claims.Add(new Claim("sub", userId.ToString()));
        }
        else
        {
            claims.Add(new Claim(ClaimTypes.NameIdentifier, Options.DefaultUserId));
            claims.Add(new Claim("sub", Options.DefaultUserId));
        }

        // Add roles
        if (Context.Request.Headers.TryGetValue("Test-Roles", out var roles))
        {
            var roleList = roles.ToString().Split(',');
            foreach (var role in roleList)
            {
                claims.Add(new Claim(ClaimTypes.Role, role.Trim()));
            }
        }
        else
        {
            foreach (var role in Options.DefaultRoles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }
        }

        // Add email
        if (Context.Request.Headers.TryGetValue("Test-Email", out var email))
        {
            claims.Add(new Claim(ClaimTypes.Email, email.ToString()));
        }
        else
        {
            claims.Add(new Claim(ClaimTypes.Email, "test@example.com"));
        }

        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, "Test");

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}