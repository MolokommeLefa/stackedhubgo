using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace StackedHub.Api.Helpers;

public static class Ids
{
    public static bool TryParse(string? value, out int id) =>
        int.TryParse(value, out id);

    public static int? UserId(this ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user.FindFirstValue(JwtRegisteredClaimNames.Sub);
        return int.TryParse(value, out var id) ? id : null;
    }

    public static int RequireUserId(this ClaimsPrincipal user) =>
        user.UserId() ?? throw new InvalidOperationException("The token is missing a user id.");
}
