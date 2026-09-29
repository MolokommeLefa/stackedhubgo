using StackedHub.Api.Contracts;
using StackedHub.Domain;

namespace StackedHub.Api.Helpers;

public static class MenuStock
{
    public static void Apply(MenuItem item, AvailabilityRequest request)
    {
        if (request.Stock is not null)
        {
            item.Stock = request.Stock.Value;
        }

        if (request.Available is not null)
        {
            item.Available = request.Available.Value;
        }

        if (item.Stock <= 0)
        {
            item.Available = false;
        }
    }
}
