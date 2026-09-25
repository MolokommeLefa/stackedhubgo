using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StackedHub.Api.Contracts;
using StackedHub.Api.Helpers;
using StackedHub.Domain;
using StackedHub.Infrastructure;

namespace StackedHub.Api.Controllers;

[ApiController]
[Route("api/inventory")]
[Authorize(Roles = $"{nameof(UserRole.Staff)},{nameof(UserRole.Admin)}")]
public class InventoryController : ControllerBase
{
    private readonly AppDbContext _db;

    public InventoryController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<MenuItemDto>>> Get(CancellationToken cancellationToken)
    {
        var items = await _db.MenuItems.AsNoTracking()
            .OrderBy(x => x.Stock)
            .ThenBy(x => x.Name)
            .ToListAsync(cancellationToken);
        return Ok(items.Select(x => x.ToDto()));
    }

    [HttpPatch("{id}")]
    public async Task<ActionResult<MenuItemDto>> Patch(string id, AvailabilityRequest request, CancellationToken cancellationToken)
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
            if (item.Stock <= 0)
            {
                item.Available = false;
            }
        }

        item.UpdatedAt = DateTime.UtcNow;
        _db.AuditLogs.Add(new AuditLog
        {
            AdminId = User.RequireUserId(),
            Action = "Adjusted stock level",
            Entity = "MenuItem",
            EntityId = item.Id,
            Details = item.Name
        });
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(item.ToDto());
    }
}
