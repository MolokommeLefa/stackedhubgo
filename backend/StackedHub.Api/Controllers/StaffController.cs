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
[Route("api/staff")]
[Authorize(Roles = $"{nameof(UserRole.Staff)},{nameof(UserRole.Admin)}")]
public class StaffController : ControllerBase
{
    private readonly OrderService _orders;
    private readonly AppDbContext _db;

    public StaffController(OrderService orders, AppDbContext db)
    {
        _orders = orders;
        _db = db;
    }

    [HttpGet("orders")]
    public async Task<ActionResult<List<OrderDto>>> Queue([FromQuery] OrderStatus? status, CancellationToken cancellationToken)
    {
        var orders = await _orders.Queue(status, cancellationToken);
        return Ok(orders.Select(x => x.ToDto()));
    }

    [HttpPatch("orders/{id}/status")]
    public async Task<ActionResult<OrderDto>> UpdateStatus(string id, UpdateStatusRequest request, CancellationToken cancellationToken)
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

        try
        {
            var order = await _orders.UpdateStatus(orderId, next.Value, User.RequireUserId(), false, null, cancellationToken);
            return Ok(order.ToDto());
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { error = "Order not found." });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpPatch("menu/{id}/availability")]
    public async Task<ActionResult<MenuItemDto>> Availability(string id, AvailabilityRequest request, CancellationToken cancellationToken)
    {
        if (!int.TryParse(id, out var menuId))
        {
            return NotFound(new { error = "Menu item not found." });
        }

        var item = await _db.MenuItems.FirstOrDefaultAsync(x => x.Id == menuId, cancellationToken);
        if (item is null)
        {
            return NotFound(new { error = "Menu item not found." });
        }

        item.Available = request.Available;
        if (request.Stock is not null)
        {
            item.Stock = request.Stock.Value;
        }

        item.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(item.ToDto());
    }
}
