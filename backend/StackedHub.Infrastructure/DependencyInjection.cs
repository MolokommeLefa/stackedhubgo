using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace StackedHub.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddStackedHubData(this IServiceCollection services, IConfiguration configuration)
    {
        var configured = configuration.GetConnectionString("DefaultConnection") ?? string.Empty;
        var useSqliteFlag = string.Equals(configuration["UseSqlite"], "true", StringComparison.OrdinalIgnoreCase);
        var useSqlite = useSqliteFlag
            || OperatingSystem.IsLinux()
            || configured.Contains("Data Source=", StringComparison.OrdinalIgnoreCase);

        var connectionString = useSqlite
            ? (configured.Contains("Data Source=", StringComparison.OrdinalIgnoreCase)
                ? configured
                : "Data Source=stackedhub.db")
            : configured;

        services.AddDbContext<AppDbContext>(options =>
        {
            if (useSqlite)
            {
                options.UseSqlite(connectionString);
            }
            else
            {
                options.UseSqlServer(connectionString);
            }
        });

        return services;
    }
}
