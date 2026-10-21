using Microsoft.EntityFrameworkCore;
using StackedHub.Infrastructure;

namespace StackedHub.Tests;

public class SqlServerMigrationTests
{
    [Fact]
    public void Design_time_factory_targets_sql_server_and_registers_foundation_migration()
    {
        using var db = new AppDbContextFactory().CreateDbContext([]);
        Assert.Equal("Microsoft.EntityFrameworkCore.SqlServer", db.Database.ProviderName);
        Assert.Contains(db.Database.GetMigrations(), id => id.Contains("AddOrderFoundation"));
        Assert.Contains(db.Database.GetMigrations(), id => id.Contains("AddGroupOrdering"));
    }
}
