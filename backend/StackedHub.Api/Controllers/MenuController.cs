using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StackedHub.Api.Contracts;
using StackedHub.Infrastructure;

namespace StackedHub.Api.Controllers;

[ApiController]
[Route("api/menu")]
public class MenuController : ControllerBase
{
    private readonly AppDbContext _db;

    public MenuController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<MenuItemDto>>> Get(CancellationToken cancellationToken)
    {
        var items = await _db.MenuItems.AsNoTracking()
            .OrderBy(x => x.Category).ThenBy(x => x.Name)
            .ToListAsync(cancellationToken);
        return Ok(items.Select(x => x.ToDto()));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MenuItemDto>> GetById(string id, CancellationToken cancellationToken)
    {
        if (!int.TryParse(id, out var menuId))
        {
            return NotFound(new { error = "Menu item not found." });
        }

        var item = await _db.MenuItems.AsNoTracking().FirstOrDefaultAsync(x => x.Id == menuId, cancellationToken);
        return item is null ? NotFound(new { error = "Menu item not found." }) : Ok(item.ToDto());
    }
}
