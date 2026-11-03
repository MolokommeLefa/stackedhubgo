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

export function parseDeliveryAddress(
  order: Pick<Order, "specialInstructions"> & { deliveryAddress?: string | undefined },
): string | null {
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
export function deliveryProgress(order: Pick<Order, "status"> & Partial<Pick<Order, "deliveryStatus">>): number {
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

const EARTH_KM = 6371;

export function distanceKm(from: Pick<GeoPoint, "lat" | "lng">, to: Pick<GeoPoint, "lat" | "lng">): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatDistanceFromAddress(km: number): string {
  if (km < 0.08) return "At your address";
  if (km < 1) return `${Math.max(50, Math.round(km * 1000 / 50) * 50)} m from your address`;
  const rounded = km < 10 ? km.toFixed(1) : String(Math.round(km));
  return `${rounded} km from your address`;
}

/** Where the courier is relative to the address the customer typed. */
export function courierPoint(
  order: Pick<Order, "status"> & Partial<Pick<Order, "deliveryStatus" | "driverLocation">>,
  destination: GeoPoint | null,
): GeoPoint | null {
  if (!destination || order.status === "Cancelled") return null;
  if (order.driverLocation) {
    return { lat: order.driverLocation.lat, lng: order.driverLocation.lng, label: "Driver" };
  }
  if (order.status === "Completed" || order.deliveryStatus === "Delivered") {
    return { ...destination, label: "Driver" };
  }
  if (order.deliveryStatus === "Out for delivery") {
    return interpolate(KITCHEN_LOCATION, destination, deliveryProgress(order));
  }
  return { ...KITCHEN_LOCATION, label: "Driver" };
}

export function deliverySeparation(
  order: Pick<Order, "status" | "specialInstructions"> &
    Partial<Pick<Order, "deliveryStatus" | "driverLocation" | "deliveryAddress">>,
): { address: string | null; destination: GeoPoint | null; courier: GeoPoint | null; km: number | null } {
  const address = parseDeliveryAddress(order);
  const destination = destinationPoint(address);
  const courier = courierPoint(order, destination);
  const km = destination && courier ? distanceKm(courier, destination) : null;
  return { address, destination, courier, km };
}

export function driverPoint(
  order: Pick<Order, "status"> & Partial<Pick<Order, "deliveryStatus" | "driverLocation">>,
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
  order: Pick<Order, "status"> &
    Partial<Pick<Order, "deliveryStatus" | "estimatedReadyAt" | "estimatedDeliveryAt" | "completedAt">>,
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
