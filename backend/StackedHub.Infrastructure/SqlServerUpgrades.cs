using System.Data;
using Microsoft.EntityFrameworkCore;

namespace StackedHub.Infrastructure;

internal static class SqlServerUpgrades
{
    public static void Apply(AppDbContext db)
    {
        db.Database.ExecuteSqlRaw("""
            IF OBJECT_ID(N'dbo.SchemaVersions', N'U') IS NULL
            CREATE TABLE dbo.SchemaVersions (
                Id NVARCHAR(64) NOT NULL PRIMARY KEY,
                AppliedAt DATETIME2 NOT NULL
            );
            """);

        ApplyStep(db, "001_order_status_events", """
            IF OBJECT_ID(N'dbo.OrderStatusEvents', N'U') IS NULL
            BEGIN
                CREATE TABLE dbo.OrderStatusEvents (
                    Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    OrderId INT NOT NULL,
                    Status NVARCHAR(32) NOT NULL,
                    At DATETIME2 NOT NULL,
                    ActorId INT NULL,
                    Note NVARCHAR(400) NULL,
                    CONSTRAINT FK_OrderStatusEvents_Orders FOREIGN KEY (OrderId) REFERENCES dbo.Orders(Id) ON DELETE CASCADE,
                    CONSTRAINT FK_OrderStatusEvents_Users FOREIGN KEY (ActorId) REFERENCES dbo.Users(Id) ON DELETE SET NULL
                );
                CREATE INDEX IX_OrderStatusEvents_OrderId ON dbo.OrderStatusEvents(OrderId);
            END
            """);

        ApplyStep(db, "002_idempotency_records", """
            IF OBJECT_ID(N'dbo.IdempotencyRecords', N'U') IS NULL
            BEGIN
                CREATE TABLE dbo.IdempotencyRecords (
                    Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    CustomerId INT NOT NULL,
                    [Key] NVARCHAR(80) NOT NULL,
                    RequestHash NVARCHAR(64) NOT NULL,
                    OrderId INT NOT NULL,
                    CreatedAt DATETIME2 NOT NULL,
                    CONSTRAINT FK_IdempotencyRecords_Users FOREIGN KEY (CustomerId) REFERENCES dbo.Users(Id) ON DELETE CASCADE,
                    CONSTRAINT FK_IdempotencyRecords_Orders FOREIGN KEY (OrderId) REFERENCES dbo.Orders(Id) ON DELETE CASCADE
                );
                CREATE UNIQUE INDEX IX_IdempotencyRecords_CustomerId_Key ON dbo.IdempotencyRecords(CustomerId, [Key]);
            END
            """);

        ApplyStep(db, "003_loyalty_transactions", """
            IF OBJECT_ID(N'dbo.LoyaltyTransactions', N'U') IS NULL
            BEGIN
                CREATE TABLE dbo.LoyaltyTransactions (
                    Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    CustomerId INT NOT NULL,
                    OrderId INT NULL,
                    Points INT NOT NULL,
                    [Type] NVARCHAR(32) NOT NULL,
                    Reason NVARCHAR(200) NOT NULL,
                    At DATETIME2 NOT NULL,
                    CONSTRAINT FK_LoyaltyTransactions_Users FOREIGN KEY (CustomerId) REFERENCES dbo.Users(Id) ON DELETE CASCADE,
                    CONSTRAINT FK_LoyaltyTransactions_Orders FOREIGN KEY (OrderId) REFERENCES dbo.Orders(Id) ON DELETE SET NULL
                );
                CREATE UNIQUE INDEX IX_LoyaltyTransactions_OrderId_Type ON dbo.LoyaltyTransactions(OrderId, [Type]) WHERE OrderId IS NOT NULL;
            END
            """);

        ApplyStep(db, "004_scheduled_orders", """
            IF COL_LENGTH('dbo.Orders', 'ScheduledFor') IS NULL
                ALTER TABLE dbo.Orders ADD ScheduledFor DATETIME2 NULL;
            IF COL_LENGTH('dbo.Orders', 'PrepLeadMinutes') IS NULL
                ALTER TABLE dbo.Orders ADD PrepLeadMinutes INT NOT NULL CONSTRAINT DF_Orders_PrepLeadMinutes DEFAULT 20;
            IF COL_LENGTH('dbo.Orders', 'ReleaseError') IS NULL
                ALTER TABLE dbo.Orders ADD ReleaseError NVARCHAR(500) NULL;
            IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Orders_ScheduledFor' AND object_id = OBJECT_ID(N'dbo.Orders'))
                CREATE INDEX IX_Orders_ScheduledFor ON dbo.Orders(ScheduledFor);
            """);
    }

    public static bool TableExists(AppDbContext db, string table)
    {
        var connection = db.Database.GetDbConnection();
        var opened = false;
        if (connection.State != ConnectionState.Open)
        {
            connection.Open();
            opened = true;
        }

        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = "SELECT CASE WHEN OBJECT_ID(@t, 'U') IS NULL THEN 0 ELSE 1 END";
            var parameter = command.CreateParameter();
            parameter.ParameterName = "@t";
            parameter.Value = "dbo." + table;
            command.Parameters.Add(parameter);
            return Convert.ToInt32(command.ExecuteScalar()) == 1;
        }
        finally
        {
            if (opened)
            {
                connection.Close();
            }
        }
    }

    private static void ApplyStep(AppDbContext db, string id, string sql)
    {
        if (StepApplied(db, id))
        {
            return;
        }

        db.Database.ExecuteSqlRaw(sql);
        db.Database.ExecuteSqlRaw(
            "INSERT INTO dbo.SchemaVersions (Id, AppliedAt) VALUES ({0}, {1})",
            id,
            DateTime.UtcNow);
    }

    private static bool StepApplied(AppDbContext db, string id)
    {
        var connection = db.Database.GetDbConnection();
        var opened = false;
        if (connection.State != ConnectionState.Open)
        {
            connection.Open();
            opened = true;
        }

        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = "SELECT COUNT(1) FROM dbo.SchemaVersions WHERE Id = @id";
            var parameter = command.CreateParameter();
            parameter.ParameterName = "@id";
            parameter.Value = id;
            command.Parameters.Add(parameter);
            return Convert.ToInt32(command.ExecuteScalar()) > 0;
        }
        finally
        {
            if (opened)
            {
                connection.Close();
            }
        }
    }
}
