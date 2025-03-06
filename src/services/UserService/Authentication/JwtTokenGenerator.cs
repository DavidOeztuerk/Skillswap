using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Contracts.Models;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using UserService.Models;

namespace UserService.Authentication;

public class JwtTokenGenerator(
    IOptions<JwtSettings> jwtSettings,
    IDateTimeProvider dateTimeProvider)
    : IJwtTokenGenerator
{
    private readonly JwtSettings jwtSettings = jwtSettings.Value ?? throw new ArgumentNullException(nameof(jwtSettings));
    private readonly IDateTimeProvider dateTimeProvider = dateTimeProvider ?? throw new ArgumentNullException(nameof(dateTimeProvider));

    public async Task<string> GenerateToken(User user)
    {
        var signingCredentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret)),
            SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.GivenName, user.FirstName),
            new(JwtRegisteredClaimNames.FamilyName, user.LastName),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var securityToken = new JwtSecurityToken(
            issuer: jwtSettings.Issuer,
            audience: jwtSettings.Audience,
            expires: dateTimeProvider.UtcNow.AddMinutes(jwtSettings.ExpireMinutes),
            claims: claims,
            signingCredentials: signingCredentials);

        return await Task.FromResult(new JwtSecurityTokenHandler().WriteToken(securityToken));
    }
}
