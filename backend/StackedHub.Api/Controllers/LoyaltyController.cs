using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StackedHub.Api.Contracts;
using StackedHub.Api.Helpers;
using StackedHub.Api.Services;
using StackedHub.Domain;

namespace StackedHub.Api.Controllers;

[ApiController]
[Route("api/loyalty")]
[Authorize(Roles = nameof(UserRole.Customer))]
public class LoyaltyController : ControllerBase
{
    private readonly LoyaltyService _loyalty;

    public LoyaltyController(LoyaltyService loyalty)
    {
        _loyalty = loyalty;
    }

    [HttpGet]
    public async Task<ActionResult<LoyaltyWalletDto>> Get(CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await _loyalty.GetWallet(User.RequireUserId(), cancellationToken));
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpPost("redeem")]
    public async Task<ActionResult<LoyaltyWalletDto>> Redeem(RedeemLoyaltyRequest request, CancellationToken cancellationToken)
    {
        try
        {
            return Ok(await _loyalty.Redeem(User.RequireUserId(), request.RewardId, cancellationToken));
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
