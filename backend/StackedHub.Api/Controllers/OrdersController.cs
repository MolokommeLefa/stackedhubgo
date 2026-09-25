using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StackedHub.Api.Contracts;
using StackedHub.Api.Helpers;
using StackedHub.Api.Services;
using StackedHub.Domain;

namespace StackedHub.Api.Controllers;

[ApiController]
[Route("api/orders")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly OrderService _orders;

    public OrdersController(OrderService orders)
    {
        _orders = orders;
    }

    [HttpGet]
    public async Task<ActionResult<List<OrderDto>>> List([FromQuery] OrderStatus? status, CancellationToken cancellationToken)
    {
        if (User.IsInRole(nameof(UserRole.Customer)))
        {
            var mine = await _orders.ForCustomer(User.RequireUserId(), cancellationToken);
            return Ok(mine.Select(x => x.ToDto()));
        }

        if (User.IsInRole(nameof(UserRole.Staff)) || User.IsInRole(nameof(UserRole.Admin)))
        {
            var queue = await _orders.Queue(status, cancellationToken);
            return Ok(queue.Select(x => x.ToDto()));
        }

        return Forbid();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<OrderDto>> Get(string id, CancellationToken cancellationToken)
    {
        if (!int.TryParse(id, out var orderId))
        {
            return NotFound(new { error = "Order not found." });
        }

        var order = await _orders.LoadOrder(orderId, cancellationToken);
        if (order is null)
        {
            return NotFound(new { error = "Order not found." });
        }

        if (User.IsInRole(nameof(UserRole.Customer)) && order.CustomerId != User.RequireUserId())
        {
            return NotFound(new { error = "Order not found." });
        }

        return Ok(order.ToDto());
    }

    [Authorize(Roles = nameof(UserRole.Customer))]
    [HttpPost]
    public async Task<ActionResult<OrderDto>> Place(PlaceOrderRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var order = await _orders.PlacePickupAsync(User.RequireUserId(), request, cancellationToken);
            return CreatedAtAction(nameof(Get), new { id = order.Id.ToString() }, order.ToDto());
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [Authorize(Roles = $"{nameof(UserRole.Staff)},{nameof(UserRole.Admin)}")]
    [HttpPatch("{id}/status")]
    [HttpPut("{id}/status")]
    public async Task<ActionResult<OrderDto>> Status(string id, UpdateStatusRequest request, CancellationToken cancellationToken)
    {
        if (!int.TryParse(id, out var orderId))
        {
            return NotFound(new { error = "Order not found." });
        }

        var next = request.Status ?? request.NextStatus;
        if (next is null)
        {
            return BadRequest(new { error = "Provide status (or nextStatus)." });
        }

        return await ApplyStatus(orderId, next.Value, false, cancellationToken);
    }

    [Authorize(Roles = nameof(UserRole.Customer))]
    [HttpPost("{id}/cancel")]
    public async Task<ActionResult<OrderDto>> Cancel(string id, CancellationToken cancellationToken)
    {
        if (!int.TryParse(id, out var orderId))
        {
            return NotFound(new { error = "Order not found." });
        }

        return await ApplyStatus(orderId, OrderStatus.Cancelled, true, cancellationToken);
    }

    private async Task<ActionResult<OrderDto>> ApplyStatus(int orderId, OrderStatus next, bool customerCancel, CancellationToken cancellationToken)
    {
        try
        {
            var staffId = User.IsInRole(nameof(UserRole.Staff)) || User.IsInRole(nameof(UserRole.Admin))
                ? User.RequireUserId()
                : (int?)null;
            var order = await _orders.UpdateStatus(
                orderId,
                next,
                staffId,
                customerCancel,
                customerCancel ? User.RequireUserId() : null,
                cancellationToken);
            return Ok(order.ToDto());
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Order not found." });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }
}
