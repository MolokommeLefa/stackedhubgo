import type { Order } from "./types";

export interface GeoPoint {
  lat: number;
  lng: number;
  label: string;
}

/** Stacked Foods trailer — Hendrik Potgieter Road, Weltevredenpark. */
export const KITCHEN_LOCATION: GeoPoint = {
  lat: -26.1314,
  lng: 27.9032,
  label: "Stacked Foods kitchen",
};

const DESTINATION_OFFSETS: Record<string, { lat: number; lng: number }> = {
  "rosebank": { lat: -26.1445, lng: 28.0416 },
  "sandton": { lat: -26.1076, lng: 28.0567 },
  "randburg": { lat: -26.0939, lng: 27.9804 },
  "roodepoort": { lat: -26.1625, lng: 27.8725 },
  "weltevreden": { lat: -26.129, lng: 27.91 },
  "florida": { lat: -26.175, lng: 27.911 },
};

export function googleMapsKey(): string {
  const key = import.meta.env["VITE_GOOGLE_MAPS_API_KEY"];
  return typeof key === "string" ? key.trim() : "";
}

export function parseDeliveryAddress(order: Pick<Order, "specialInstructions"> & { deliveryAddress?: string }): string | null {
  const direct = order.deliveryAddress?.trim();
  if (direct) return direct;
  const notes = order.specialInstructions ?? "";
  const match = notes.match(/Deliver to:\s*([^—]+)/i);
  return match?.[1]?.trim() || null;
}

export function destinationPoint(address: string | null): GeoPoint | null {
  if (!address) return null;
  const key = Object.keys(DESTINATION_OFFSETS).find((suburb) => address.toLowerCase().includes(suburb));
  const coords = (key ? DESTINATION_OFFSETS[key] : undefined) ?? {
    lat: KITCHEN_LOCATION.lat - 0.018,
    lng: KITCHEN_LOCATION.lng + 0.028,
  };
  return { lat: coords.lat, lng: coords.lng, label: address };
}

/** Progress 0 at kitchen, 1 at the door. */
export function deliveryProgress(order: Pick<Order, "status" | "deliveryStatus">): number {
  if (order.status === "Completed" || order.deliveryStatus === "Delivered") return 1;
  if (order.deliveryStatus === "Out for delivery") return 0.62;
  if (order.status === "Ready" || order.deliveryStatus === "Ready for collection") return 0.08;
  return 0;
}

export function interpolate(from: GeoPoint, to: GeoPoint, t: number): GeoPoint {
  const clamped = Math.min(1, Math.max(0, t));
  return {
    lat: from.lat + (to.lat - from.lat) * clamped,
    lng: from.lng + (to.lng - from.lng) * clamped,
    label: "Driver",
  };
}

export function driverPoint(
  order: Pick<Order, "status" | "deliveryStatus"> & { driverLocation?: { lat: number; lng: number } },
  destination: GeoPoint | null,
): GeoPoint | null {
  if (order.driverLocation) {
    return { lat: order.driverLocation.lat, lng: order.driverLocation.lng, label: "Driver" };
  }
  if (!destination) return null;
  if (order.deliveryStatus !== "Out for delivery" && order.status !== "Completed") return null;
  return interpolate(KITCHEN_LOCATION, destination, deliveryProgress(order));
}

export function estimatedDeliveryLabel(
  order: Pick<Order, "status" | "deliveryStatus" | "estimatedReadyAt" | "estimatedDeliveryAt" | "completedAt">,
): string {
  if (order.status === "Completed" || order.deliveryStatus === "Delivered") return "Arrived";
  if (order.deliveryStatus === "Out for delivery") {
    const raw = order.estimatedDeliveryAt ?? order.estimatedReadyAt;
    const eta = raw ? new Date(raw) : new Date(Date.now() + 15 * 60_000);
    return eta.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
  }
  return "Shown after the driver is dispatched";
}

export function mapsDirectionsUrl(origin: GeoPoint, destination: GeoPoint | string): string {
  const dest = typeof destination === "string" ? destination : `${destination.lat},${destination.lng}`;
  return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${encodeURIComponent(dest)}`;
}

export function googleEmbedSrc(origin: GeoPoint, destination: GeoPoint, key: string): string {
  if (key) {
    const params = new URLSearchParams({
      key,
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      mode: "driving",
    });
    return `https://www.google.com/maps/embed/v1/directions?${params.toString()}`;
  }
  return `https://maps.google.com/maps?saddr=${origin.lat},${origin.lng}&daddr=${destination.lat},${destination.lng}&output=embed`;
}

export function osmEmbedSrc(point: GeoPoint): string {
  const d = 0.03;
  const bbox = `${point.lng - d},${point.lat - d},${point.lng + d},${point.lat + d}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${point.lat}%2C${point.lng}`;
}
