import { useEffect, useState } from "react";
import { MapPin, Navigation, TriangleAlert } from "lucide-react";
import type { Order } from "@/lib/types";
import {
  addressHasKnownArea,
  courierPoint,
  deliverySeparation,
  distanceKm,
  estimatedDeliveryLabel,
  formatDistanceFromAddress,
  geocodeAddress,
  googleEmbedSrc,
  googleMapsKey,
  type GeoPoint,
  KITCHEN_LOCATION,
  mapsDirectionsUrl,
  osmEmbedSrc,
} from "@/lib/maps";

export function DeliveryTrackingMap({ order }: { order: Order }) {
  const [googleFailed, setGoogleFailed] = useState(false);
  const separation = deliverySeparation(order);
  const { address } = separation;
  const [geocoded, setGeocoded] = useState<GeoPoint | null>(null);
  const knownArea = addressHasKnownArea(address);
  const [locating, setLocating] = useState(() => Boolean(address) && !addressHasKnownArea(address));
  const [trackedAddress, setTrackedAddress] = useState(address);
  if (trackedAddress !== address) {
    setTrackedAddress(address);
    setGeocoded(null);
    setLocating(Boolean(address) && !addressHasKnownArea(address));
  }

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    setLocating(true);
    setGeocoded(null);
    void geocodeAddress(address)
      .then((point) => {
        if (!cancelled) setGeocoded(point);
      })
      .catch(() => {
        if (!cancelled) setGeocoded(null);
      })
      .finally(() => {
        if (!cancelled) setLocating(false);
      });
    return () => {
      cancelled = true;
    };
  }, [address]);

  const destination = geocoded ?? (knownArea || !locating ? separation.destination : null);
  const courier = courierPoint(order, destination);
  const km = destination && courier ? distanceKm(courier, destination) : null;
  const onTheWay = order.deliveryStatus === "Out for delivery" || Boolean(order.driverLocation);
  const arrived = km !== null && km < 0.08;
  const mapsAvailable = Boolean(destination) && !googleFailed;
  const key = googleMapsKey();
  const origin = courier ?? KITCHEN_LOCATION;
  const embedSrc = destination && mapsAvailable ? googleEmbedSrc(origin, destination, key) : "";
  const fallbackSrc = destination ? osmEmbedSrc(courier ?? destination) : "";
  const eta = estimatedDeliveryLabel(order);
  const statusLabel =
    order.deliveryStatus ??
    (order.status === "Completed" ? "Delivered" : order.status === "Ready" ? "Ready for dispatch" : "Waiting for kitchen");
  const distanceLabel =
    km === null ? (locating ? "Measuring the trip…" : "Distance unavailable") : formatDistanceFromAddress(km);
  const distanceDetail = !address
    ? "Add a street and suburb so we can measure the trip."
    : locating && !geocoded
      ? `Finding ${address} so we can measure how far the driver is.`
      : arrived
        ? `The driver is at ${address}.`
        : onTheWay
          ? `Still travelling to ${address}.`
          : `The driver is still at the kitchen, ${distanceLabel.replace(" from your address", "")} from ${address}.`;

  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-border" aria-label="Driver tracking map">
      <div className="flex items-start justify-between gap-3 p-4">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{distanceLabel}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{distanceDetail}</p>
        </div>
        <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs font-semibold">{statusLabel}</span>
      </div>

      {mapsAvailable && destination ? (
        <div className="relative h-72 bg-secondary">
          <iframe
            title="Google Maps delivery tracking"
            src={embedSrc}
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            onError={() => setGoogleFailed(true)}
          />
        </div>
      ) : (
        <div className="space-y-3 bg-secondary p-4" role="status">
          <div className="flex items-start gap-2 rounded-xl bg-card p-3 text-sm">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
            <p>
              {destination
                ? "Google Maps could not be loaded. The distance above still uses your address, with a backup map."
                : "Map services are unavailable because this order has no delivery destination."}
            </p>
          </div>
          {destination && (
            <iframe
              title="Backup delivery map"
              src={fallbackSrc}
              className="h-52 w-full rounded-xl border-0"
              loading="lazy"
            />
          )}
        </div>
      )}

      <div className="grid gap-2 p-4 sm:grid-cols-3">
        <div className="rounded-xl bg-secondary p-3">
          <p className="text-xs text-muted-foreground">Distance left</p>
          <p className="mt-1 text-sm font-semibold tabular-nums">{distanceLabel}</p>
        </div>
        <div className="rounded-xl bg-secondary p-3">
          <p className="text-xs text-muted-foreground">Order status</p>
          <p className="mt-1 text-sm font-semibold">{statusLabel}</p>
        </div>
        <div className="rounded-xl bg-secondary p-3">
          <p className="text-xs text-muted-foreground">Estimated delivery</p>
          <p className="mt-1 text-sm font-semibold">{eta}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 px-4 pb-4">
        <p className="flex min-h-11 items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="size-3.5" aria-hidden />
          Kitchen: {KITCHEN_LOCATION.label}
        </p>
        {destination && (
          <a
            href={mapsDirectionsUrl(origin, address ?? destination)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground"
          >
            <Navigation className="size-3.5" aria-hidden />
            Open in Google Maps
          </a>
        )}
        {mapsAvailable && (
          <button
            type="button"
            onClick={() => setGoogleFailed(true)}
            className="inline-flex min-h-11 items-center rounded-full bg-secondary px-4 text-xs font-semibold"
          >
            Maps not loading? Use backup
          </button>
        )}
      </div>
    </section>
  );
}
