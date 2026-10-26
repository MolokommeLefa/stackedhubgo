namespace StackedHub.Api.Options;

public sealed class KitchenOptions
{
    public const string Section = "Kitchen";

    public int OpenHour { get; set; } = 10;
    public int CloseHour { get; set; } = 21;
    public int SlotMinutes { get; set; } = 15;
    public int MaxOrdersPerSlot { get; set; } = 8;
    public int PrepLeadMinutes { get; set; } = 20;
    public int MinScheduleAheadMinutes { get; set; } = 30;
    public int MaxScheduleAheadDays { get; set; } = 7;
    public bool ReleaseWorkerEnabled { get; set; } = true;
    public int ReleasePollSeconds { get; set; } = 30;
    public string TimeZone { get; set; } = "South Africa Standard Time";

    public TimeZoneInfo ResolveTimeZone()
    {
        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(TimeZone);
        }
        catch (TimeZoneNotFoundException)
        {
            var fallback = OperatingSystem.IsWindows() ? "South Africa Standard Time" : "Africa/Johannesburg";
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById(fallback);
            }
            catch (TimeZoneNotFoundException)
            {
                return TimeZoneInfo.Utc;
            }
        }
    }
}
