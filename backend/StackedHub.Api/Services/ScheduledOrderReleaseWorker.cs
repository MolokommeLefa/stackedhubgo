using Microsoft.Extensions.Options;
using StackedHub.Api.Options;

namespace StackedHub.Api.Services;

public sealed class ScheduledOrderReleaseWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopes;
    private readonly ILogger<ScheduledOrderReleaseWorker> _logger;
    private readonly KitchenOptions _kitchen;

    public ScheduledOrderReleaseWorker(
        IServiceScopeFactory scopes,
        IOptions<KitchenOptions> kitchen,
        ILogger<ScheduledOrderReleaseWorker> logger)
    {
        _scopes = scopes;
        _logger = logger;
        _kitchen = kitchen.Value;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var delay = TimeSpan.FromSeconds(Math.Max(5, _kitchen.ReleasePollSeconds));
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopes.CreateScope();
                var orders = scope.ServiceProvider.GetRequiredService<OrderService>();
                var released = await orders.ReleaseDueScheduledOrders(stoppingToken);
                if (released > 0)
                {
                    _logger.LogInformation("Released {Count} scheduled orders into the kitchen queue.", released);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to release due scheduled orders.");
            }

            try
            {
                await Task.Delay(delay, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }
}
