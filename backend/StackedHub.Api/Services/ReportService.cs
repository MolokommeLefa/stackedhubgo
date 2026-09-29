using Microsoft.EntityFrameworkCore;
using StackedHub.Api.Contracts;
using StackedHub.Domain;
using StackedHub.Infrastructure;

namespace StackedHub.Api.Services;

public class ReportService
{
    private readonly AppDbContext _db;

    public ReportService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<CustomerDto>> Customers(CancellationToken cancellationToken)
    {
        var users = await _db.Users.AsNoTracking()
            .Where(x => x.Role == UserRole.Customer)
            .OrderBy(x => x.LastName).ThenBy(x => x.FirstName)
            .ToListAsync(cancellationToken);
        var orders = await _db.Orders.AsNoTracking().ToListAsync(cancellationToken);
        return users.Select(user => user.ToCustomer(orders)).ToList();
    }

    public async Task<ReportDto> Build(CancellationToken cancellationToken)
    {
        var orders = await _db.Orders.AsNoTracking().Include(x => x.Items).ToListAsync(cancellationToken);
        var billed = orders.Where(x => x.Status != OrderStatus.Cancelled).ToList();
        var completed = billed.Where(x => x.Status == OrderStatus.Completed).ToList();

        var hourly = billed
            .GroupBy(x => x.PlacedAt.ToString("HH:00"))
            .OrderBy(g => g.Key)
            .Select(g => new HourPoint(g.Key, g.Count()))
            .ToList();

        var revenueByDay = billed
            .GroupBy(x => x.PlacedAt.ToString("ddd"))
            .Select(g => new DayRevenue(g.Key, g.Sum(x => x.Total)))
            .ToList();

        var best = billed
            .SelectMany(x => x.Items)
            .GroupBy(x => x.Name)
            .Select(g => new BestSeller(g.Key, g.Sum(i => i.Quantity)))
            .OrderByDescending(x => x.Sold)
            .Take(5)
            .ToList();

        var channels = billed
            .GroupBy(x => x.Channel)
            .Select(g => new ChannelSales(
                g.Key == OrderChannel.InStore ? "In-store" :
                g.Key == OrderChannel.MobileApp ? "Mobile app" :
                g.Key == OrderChannel.UberEats ? "Uber Eats" :
                g.Key == OrderChannel.MrD ? "Mr D" : g.Key.ToString(),
                g.Sum(x => x.Total)))
            .OrderByDescending(x => x.Total)
            .ToList();

        return new ReportDto(billed.Count, completed.Sum(x => x.Total), hourly, revenueByDay, best, channels);
    }
}
