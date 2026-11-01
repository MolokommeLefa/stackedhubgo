import { useState } from "react";
import { MapPin, Navigation, TriangleAlert } from "lucide-react";
import type { Order } from "@/lib/types";
import {
  destinationPoint,
  driverPoint,
  estimatedDeliveryLabel,
  googleEmbedSrc,
  googleMapsKey,
  KITCHEN_LOCATION,
  mapsDirectionsUrl,
  osmEmbedSrc,
  parseDeliveryAddress,
} from "@/lib/maps";

export function DeliveryTrackingMap({ order }: { order: Order }) {
  const [googleFailed, setGoogleFailed] = useState(false);
  const address = parseDeliveryAddress(order);
  const destination = destinationPoint(address);
  const driver = destination ? driverPoint(order, destination) : null;
  const gpsAvailable = Boolean(driver);
  const mapsAvailable = Boolean(destination) && !googleFailed;
  const key = googleMapsKey();
  const origin = driver ?? KITCHEN_LOCATION;
  const embedSrc = destination && mapsAvailable ? googleEmbedSrc(origin, destination, key) : "";
  const fallbackSrc = destination ? osmEmbedSrc(gpsAvailable ? driver! : destination) : "";
  const eta = estimatedDeliveryLabel(order);
  const statusLabel =
    order.deliveryStatus ??
    (order.status === "Completed" ? "Delivered" : order.status === "Ready" ? "Ready for dispatch" : "Waiting for kitchen");

  return (
    <section className="mt-5 overflow-hidden rounded-2xl border border-border" aria-label="Driver tracking map">
      <div className="flex items-start justify-between gap-3 p-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">Delivery map</p>
          <h2 className="mt-1 font-display text-xl font-semibold">
            {gpsAvailable ? "Your driver is on the way" : order.status === "Completed" ? "Delivery completed" : "Your delivery"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {address ? `Destination: ${address}` : "No delivery address is stored on this order yet."}
          </p>
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
                ? "Google Maps could not be loaded. Showing a backup map and written directions instead."
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

      {!gpsAvailable && destination && (
        <p className="px-4 pt-3 text-xs text-muted-foreground">
          Driver GPS is not available yet. The map shows the kitchen and destination until dispatch starts.
        </p>
      )}

      <div className="grid gap-2 p-4 sm:grid-cols-3">
        <div className="rounded-xl bg-secondary p-3">
          <p className="text-xs text-muted-foreground">Order status</p>
          <p className="mt-1 text-sm font-semibold">{statusLabel}</p>
        </div>
        <div className="rounded-xl bg-secondary p-3">
          <p className="text-xs text-muted-foreground">Estimated delivery</p>
          <p className="mt-1 text-sm font-semibold">{eta}</p>
        </div>
        <div className="rounded-xl bg-secondary p-3">
          <p className="text-xs text-muted-foreground">Location updates</p>
          <p className="mt-1 text-sm font-semibold">{gpsAvailable ? "Driver location on map" : "GPS unavailable"}</p>
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
