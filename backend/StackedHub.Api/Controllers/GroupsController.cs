using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StackedHub.Api.Contracts;
using StackedHub.Api.Helpers;
using StackedHub.Api.Services;
using StackedHub.Domain;

namespace StackedHub.Api.Controllers;

[ApiController]
[Route("api/groups")]
[Authorize(Roles = nameof(UserRole.Customer))]
public class GroupsController : ControllerBase
{
    private readonly GroupOrderService _groups;

    public GroupsController(GroupOrderService groups)
    {
        _groups = groups;
    }

    [HttpGet]
    public async Task<ActionResult<List<GroupBasketDto>>> List(CancellationToken cancellationToken)
    {
        var baskets = await _groups.ForCustomer(User.RequireUserId(), cancellationToken);
        return Ok(baskets.Select(x => x.ToDto()));
    }

    [HttpPost]
    public async Task<ActionResult<GroupBasketDto>> Create(CreateGroupBasketRequest? request, CancellationToken cancellationToken)
    {
        try
        {
            var basket = await _groups.Create(User.RequireUserId(), request ?? new CreateGroupBasketRequest(null), cancellationToken);
            return CreatedAtAction(nameof(Get), new { id = basket.Id.ToString() }, basket.ToDto());
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

    [HttpPost("join")]
    public async Task<ActionResult<GroupBasketDto>> Join(JoinGroupBasketRequest request, CancellationToken cancellationToken)
    {
        return await Execute(() => _groups.Join(User.RequireUserId(), request.JoinCode, cancellationToken));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<GroupBasketDto>> Get(string id, CancellationToken cancellationToken)
    {
        if (!int.TryParse(id, out var basketId))
        {
            return NotFound(new { error = "Group order not found." });
        }

        return await Execute(() => _groups.GetForParticipant(basketId, User.RequireUserId(), cancellationToken));
    }

    [HttpPost("{id}/items")]
    public async Task<ActionResult<GroupBasketDto>> AddItem(string id, UpsertGroupItemRequest request, CancellationToken cancellationToken)
    {
        if (!int.TryParse(id, out var basketId))
        {
            return NotFound(new { error = "Group order not found." });
        }

        return await Execute(() => _groups.AddItem(basketId, User.RequireUserId(), request, cancellationToken));
    }

    [HttpPatch("{id}/items/{itemId}")]
    public async Task<ActionResult<GroupBasketDto>> UpdateItem(string id, string itemId, UpsertGroupItemRequest request, CancellationToken cancellationToken)
    {
        if (!int.TryParse(id, out var basketId) || !int.TryParse(itemId, out var lineId))
        {
            return NotFound(new { error = "Group order not found." });
        }

        return await Execute(() => _groups.UpdateItem(basketId, lineId, User.RequireUserId(), request, cancellationToken));
    }

    [HttpDelete("{id}/items/{itemId}")]
    public async Task<ActionResult<GroupBasketDto>> RemoveItem(string id, string itemId, CancellationToken cancellationToken)
    {
        if (!int.TryParse(id, out var basketId) || !int.TryParse(itemId, out var lineId))
        {
            return NotFound(new { error = "Group order not found." });
        }

        return await Execute(() => _groups.RemoveItem(basketId, lineId, User.RequireUserId(), cancellationToken));
    }

    [HttpPost("{id}/lock")]
    public async Task<ActionResult<GroupBasketDto>> Lock(string id, CancellationToken cancellationToken)
    {
        if (!int.TryParse(id, out var basketId))
        {
            return NotFound(new { error = "Group order not found." });
        }

        return await Execute(() => _groups.Lock(basketId, User.RequireUserId(), true, cancellationToken));
    }

    [HttpPost("{id}/unlock")]
    public async Task<ActionResult<GroupBasketDto>> Unlock(string id, CancellationToken cancellationToken)
    {
        if (!int.TryParse(id, out var basketId))
        {
            return NotFound(new { error = "Group order not found." });
        }

        return await Execute(() => _groups.Lock(basketId, User.RequireUserId(), false, cancellationToken));
    }

    [HttpPost("{id}/cancel")]
    public async Task<ActionResult<GroupBasketDto>> Cancel(string id, CancellationToken cancellationToken)
    {
        if (!int.TryParse(id, out var basketId))
        {
            return NotFound(new { error = "Group order not found." });
        }

        return await Execute(() => _groups.Cancel(basketId, User.RequireUserId(), cancellationToken));
    }

    [HttpPost("{id}/leave")]
    public async Task<ActionResult<GroupBasketDto>> Leave(string id, CancellationToken cancellationToken)
    {
        if (!int.TryParse(id, out var basketId))
        {
            return NotFound(new { error = "Group order not found." });
        }

        return await Execute(() => _groups.Leave(basketId, User.RequireUserId(), cancellationToken));
    }

    [HttpPost("{id}/checkout")]
    public async Task<ActionResult<OrderDto>> Checkout(
        string id,
        CheckoutGroupBasketRequest request,
        [FromHeader(Name = "Idempotency-Key")] string? idempotencyKey,
        CancellationToken cancellationToken)
    {
        if (!int.TryParse(id, out var basketId))
        {
            return NotFound(new { error = "Group order not found." });
        }

        try
        {
            var key = string.IsNullOrWhiteSpace(request.IdempotencyKey) ? idempotencyKey : request.IdempotencyKey;
            var result = await _groups.Checkout(basketId, User.RequireUserId(), request, key, cancellationToken);
            return Ok(result.Order.ToDto());
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Group order not found." });
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

    private async Task<ActionResult<GroupBasketDto>> Execute(Func<Task<GroupBasket>> action)
    {
        try
        {
            var basket = await action();
            return Ok(basket.ToDto());
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Group order not found." });
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
