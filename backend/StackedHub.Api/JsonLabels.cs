using System.Text.Json;
using System.Text.Json.Serialization;
using StackedHub.Domain;

namespace StackedHub.Api;

public sealed class OrderStatusJsonConverter : JsonConverter<OrderStatus>
{
    public override OrderStatus Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Number && reader.TryGetInt32(out var number) && Enum.IsDefined((OrderStatus)number))
        {
            return (OrderStatus)number;
        }

        var value = reader.GetString();
        return value switch
        {
            "Placed" => OrderStatus.Placed,
            "In kitchen" or "InKitchen" => OrderStatus.InKitchen,
            "Ready" => OrderStatus.Ready,
            "Completed" => OrderStatus.Completed,
            "Cancelled" => OrderStatus.Cancelled,
            _ => throw new JsonException($"Unknown order status '{value}'.")
        };
    }

    public override void Write(Utf8JsonWriter writer, OrderStatus value, JsonSerializerOptions options) =>
        writer.WriteStringValue(value == OrderStatus.InKitchen ? "In kitchen" : value.ToString());
}

public sealed class OrderChannelJsonConverter : JsonConverter<OrderChannel>
{
    public override OrderChannel Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Number && reader.TryGetInt32(out var number) && Enum.IsDefined((OrderChannel)number))
        {
            return (OrderChannel)number;
        }

        var value = reader.GetString();
        return value switch
        {
            "In-store" or "InStore" => OrderChannel.InStore,
            "Website" => OrderChannel.Website,
            "Mobile app" or "MobileApp" => OrderChannel.MobileApp,
            "Uber Eats" or "UberEats" => OrderChannel.UberEats,
            "Mr D" or "MrD" => OrderChannel.MrD,
            "WhatsApp" => OrderChannel.WhatsApp,
            _ => throw new JsonException($"Unknown order channel '{value}'.")
        };
    }

    public override void Write(Utf8JsonWriter writer, OrderChannel value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value switch
        {
            OrderChannel.InStore => "In-store",
            OrderChannel.MobileApp => "Mobile app",
            OrderChannel.UberEats => "Uber Eats",
            OrderChannel.MrD => "Mr D",
            _ => value.ToString()
        });
    }
}
