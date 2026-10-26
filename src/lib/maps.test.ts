import { describe, expect, it } from "vitest";
import {
  destinationPoint,
  driverPoint,
  estimatedDeliveryLabel,
  interpolate,
  parseDeliveryAddress,
} from "./maps";

describe("delivery map helpers", () => {
  it("reads a packed Deliver to address", () => {
    expect(parseDeliveryAddress({ specialInstructions: "Delivery — Deliver to: 12 Main Rd, Rosebank" })).toBe(
      "12 Main Rd, Rosebank",
    );
  });

  it("places Rosebank near Johannesburg CBD, not the kitchen", () => {
    const point = destinationPoint("12 Main Rd, Rosebank");
    expect(point?.lat).toBeCloseTo(-26.1445, 3);
  });

  it("hides the driver until the order is out for delivery", () => {
    const dest = destinationPoint("12 Main Rd, Rosebank")!;
    expect(driverPoint({ status: "In kitchen", deliveryStatus: "Preparing" }, dest)).toBeNull();
    expect(driverPoint({ status: "Ready", deliveryStatus: "Out for delivery" }, dest)?.label).toBe("Driver");
  });

  it("uses live driver coordinates when the API sends them", () => {
    const dest = destinationPoint("12 Main Rd, Rosebank")!;
    const driver = driverPoint(
      { status: "Ready", deliveryStatus: "Out for delivery", driverLocation: { lat: -26.12, lng: 27.95 } },
      dest,
    );
    expect(driver?.lat).toBe(-26.12);
  });

  it("interpolates between kitchen and destination", () => {
    const a = { lat: 0, lng: 0, label: "A" };
    const b = { lat: 10, lng: 10, label: "B" };
    expect(interpolate(a, b, 0.5)).toEqual({ lat: 5, lng: 5, label: "Driver" });
  });

  it("shows arrived after delivery completes", () => {
    expect(estimatedDeliveryLabel({ status: "Completed", deliveryStatus: "Delivered" })).toBe("Arrived");
  });
});
