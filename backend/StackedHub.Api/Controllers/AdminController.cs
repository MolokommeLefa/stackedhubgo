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
[Route("api/admin")]
[Authorize(Roles = nameof(UserRole.Admin))]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ReportService _reports;

    public AdminController(AppDbContext db, ReportService reports)
    {
        _db = db;
        _reports = reports;
    }

    [HttpGet("users")]
    public async Task<ActionResult<List<AuthUserDto>>> Users(CancellationToken cancellationToken)
    {
        var users = await _db.Users.AsNoTracking().OrderBy(x => x.Role).ThenBy(x => x.Email).ToListAsync(cancellationToken);
        return Ok(users.Select(x => x.ToAuth()));
    }

    [HttpPatch("users/{id}")]
    public async Task<ActionResult<AuthUserDto>> SetActive(string id, ActivateUserRequest request, CancellationToken cancellationToken)
    {
        if (!int.TryParse(id, out var userId))
        {
            return NotFound(new { error = "User not found." });
        }

        var user = await _db.Users.FirstOrDefaultAsync(x => x.Id == userId, cancellationToken);
        if (user is null)
        {
            return NotFound(new { error = "User not found." });
        }

        user.IsActive = request.IsActive;
        _db.AuditLogs.Add(new AuditLog
        {
            AdminId = User.RequireUserId(),
            Action = request.IsActive ? "Activate user" : "Deactivate user",
            Entity = "User",
            EntityId = userId,
            Details = user.Email
        });
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(user.ToAuth());
    }

    [HttpPost("menu")]
    public async Task<ActionResult<MenuItemDto>> CreateMenu(UpsertMenuRequest request, CancellationToken cancellationToken)
    {
        var item = Apply(new MenuItem(), request);
        _db.MenuItems.Add(item);
        await _db.SaveChangesAsync(cancellationToken);
        _db.AuditLogs.Add(new AuditLog
        {
            AdminId = User.RequireUserId(),
            Action = "Created menu item",
            Entity = "MenuItem",
            EntityId = item.Id,
            Details = item.Name
        });
        await _db.SaveChangesAsync(cancellationToken);
        return Created($"/api/menu/{item.Id}", item.ToDto());
    }

    [HttpPut("menu/{id}")]
    public async Task<ActionResult<MenuItemDto>> UpdateMenu(string id, UpsertMenuRequest request, CancellationToken cancellationToken)
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

        Apply(item, request);
        item.UpdatedAt = DateTime.UtcNow;
        _db.AuditLogs.Add(new AuditLog
        {
            AdminId = User.RequireUserId(),
            Action = "Updated menu item",
            Entity = "MenuItem",
            EntityId = menuId,
            Details = item.Name
        });
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(item.ToDto());
    }

    [HttpGet("reports")]
    public async Task<ActionResult<ReportDto>> Reports(CancellationToken cancellationToken) =>
        Ok(await _reports.Build(cancellationToken));

    [HttpGet("audit")]
    public async Task<ActionResult<List<AuditLogDto>>> Audit(CancellationToken cancellationToken)
    {
        var rows = await _db.AuditLogs.AsNoTracking()
            .Include(x => x.Admin)
            .OrderByDescending(x => x.Id)
            .Take(50)
            .ToListAsync(cancellationToken);
        return Ok(rows.Select(x => x.ToDto()));
    }

    private static MenuItem Apply(MenuItem item, UpsertMenuRequest request)
    {
        item.Name = request.Name.Trim();
        item.Description = request.Description.Trim();
        item.Category = request.Category;
        item.Price = request.Price;
        item.Stock = request.Stock;
        item.LowStockThreshold = request.LowStockThreshold;
        item.Spicy = request.Spicy;
        item.Available = request.Available;
        return item;
    }
}
