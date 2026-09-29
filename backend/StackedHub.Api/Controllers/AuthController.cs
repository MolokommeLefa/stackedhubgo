using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StackedHub.Api.Contracts;
using StackedHub.Api.Helpers;
using StackedHub.Api.Services;
using StackedHub.Domain;
using StackedHub.Infrastructure;

namespace StackedHub.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly TokenService _tokens;

    public AuthController(AppDbContext db, TokenService tokens)
    {
        _db = db;
        _tokens = tokens;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (await _db.Users.AnyAsync(x => x.Email == email, cancellationToken))
        {
            return Conflict(new { error = "That email is already registered." });
        }

        var (first, last) = Mapping.SplitName(request.FirstName, request.LastName, request.Name, email);
        var user = new User
        {
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FirstName = first,
            LastName = last,
            PhoneNumber = request.PhoneNumber?.Trim() ?? string.Empty,
            Role = UserRole.Customer
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(new AuthResponse(_tokens.Create(user), user.ToAuth()));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(x => x.Email == email, cancellationToken);
        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { error = "Email or password is incorrect." });
        }

        if (!user.IsActive)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { error = "This account has been deactivated." });
        }

        return Ok(new AuthResponse(_tokens.Create(user), user.ToAuth()));
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var exists = await _db.Users.AnyAsync(x => x.Email == email, cancellationToken);
        _ = exists;
        return Ok(new { message = "If that email is registered, a reset link was sent." });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<AuthUserDto>> Me(CancellationToken cancellationToken)
    {
        var id = User.UserId();
        if (id is null)
        {
            return Unauthorized();
        }

        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        return user is null ? Unauthorized() : Ok(user.ToAuth());
    }
}
