"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import {
  TRIP,
  DAY_TONES,
  KIND_LABEL,
  MERGED_FROM,
  MERGED_CHILD_IDS,
  mergedDayIdsFor,
  type Place,
} from "@/data/trip";
import { useRouter } from "next/navigation";
import { getHeroPhotoForPlace, thumbnailUrl } from "@/lib/photos";
import Link from "next/link";
import { Icon } from "./icons";

function getParentDayId(dayId: number): number {
  return MERGED_FROM[dayId] ?? dayId;
}

function getGroupDayIds(dayId: number): number[] {
  return mergedDayIdsFor(dayId);
}

// ─── Place sheet ──────────────────────────────────────────

function PlaceSheet({
  place,
  dayId,
  open,
  onToggle,
  onClose,
}: {
  place: Place | null;
  dayId: number | null;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const day = dayId ? TRIP.days.find((d) => d.id === dayId) : null;
  const heroPhoto = place ? getHeroPhotoForPlace(place.id) : null;

  return (
    <div
      className="sheet"
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 400,
        background: "var(--paper)",
        borderRadius: "20px 20px 0 0",
        padding: "0 0 16px",
        transform: open ? "translateY(0)" : "translateY(calc(100% - 36px))",
        transition: "transform 0.25s ease-out",
      }}
    >
      {/* Handle (always tappable) */}
      <button
        onClick={onToggle}
        aria-label={open ? "Réduire" : "Ouvrir"}
        style={{
          width: "100%",
          padding: "10px 0 8px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
        }}
      >
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--ink-3)", opacity: 0.3 }} />
        {!open && (
          <span className="eyebrow" style={{ fontSize: 9 }}>
            {place ? "Voir le détail" : "Sélectionne un point"}
          </span>
        )}
      </button>

      {open && place && day && (
        <div style={{ padding: "4px 16px 0" }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div
              style={{
                width: 84,
                height: 84,
                borderRadius: 12,
                overflow: "hidden",
                flexShrink: 0,
                background: heroPhoto ? "transparent" : `linear-gradient(135deg, ${DAY_TONES[day.id - 1][0]}, ${DAY_TONES[day.id - 1][1]})`,
              }}
            >
              {heroPhoto?.url && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={thumbnailUrl(heroPhoto.url, 168)}
                  alt={place.name}
                  loading="lazy"
                  decoding="async"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="eyebrow eyebrow-terra" style={{ fontSize: 10 }}>
                Jour {day.id} · {KIND_LABEL[place.kind]}
              </div>
              <div className="serif" style={{ fontSize: 18, fontWeight: 500, color: "var(--ink)", lineHeight: 1.15, marginTop: 2 }}>
                {place.name}
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 6, lineHeight: 1.4 }}>
                {place.context.slice(0, 90)}…
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button
              onClick={onClose}
              style={{
                flex: 0, padding: "10px 16px", borderRadius: 100, border: "1px solid rgba(26,20,16,0.12)",
                background: "transparent", color: "var(--ink-2)",
                fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer",
              }}
            >
              Fermer
            </button>
            <Link href={`/place/${place.id}`} style={{ flex: 1, textDecoration: "none" }}>
              <div
                className="btn btn-primary"
                style={{ width: "100%", padding: "10px 16px" }}
              >
                Voir la fiche
                <Icon.Chevron s={12} />
              </div>
            </Link>
          </div>
        </div>
      )}

      {open && !place && (
        <div style={{ padding: "8px 16px 0", color: "var(--ink-3)", fontSize: 13, lineHeight: 1.5 }}>
          Touche un point sur la carte pour afficher les infos du lieu.
        </div>
      )}
    </div>
  );
}

// ─── Leaflet Map ──────────────────────────────────────────

interface CreteMapProps {
  initialDayId?: number;
  initialPlaceId?: string;
  initialRouteMode?: boolean;
  // Controlled place selection — when provided, overrides internal state.
  // Used by the desktop layout to keep the map in sync with the right panel.
  selectedPlaceId?: string | null;
  // Fires when the user clicks a marker — lets the desktop sync sidebar + panel.
  onPlaceClick?: (placeId: string, dayId: number) => void;
  // Hides the mobile-chrome top bar (route toggle + day chips) when embedded in desktop.
  hideMobileChrome?: boolean;
}

export interface CreteMapHandle {
  zoomIn(): void;
  zoomOut(): void;
}

export const CreteMap = forwardRef<CreteMapHandle, CreteMapProps>(
function CreteMap({ initialDayId, initialPlaceId, initialRouteMode, selectedPlaceId: controlledPlaceId, onPlaceClick, hideMobileChrome }, ref) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<unknown>(null);
  const markersRef = useRef<unknown[]>([]);
  const polylineRef = useRef<unknown>(null);
  const router = useRouter();

  const [routeMode, setRouteMode] = useState(initialRouteMode ?? false);
  // Normalise to parent day (e.g. day 2 → day 1) so merged days always select the group
  const [selectedDayId, setSelectedDayId] = useState(getParentDayId(initialDayId ?? 1));
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(initialPlaceId ?? null);
  const [sheetOpen, setSheetOpen] = useState<boolean>(Boolean(initialPlaceId));
  const [mapReady, setMapReady] = useState(false);

  // Days visible in the route-mode chip selector (merged children hidden)
  const visibleDays = TRIP.days.filter((d) => !MERGED_CHILD_IDS.has(d.id));

  const selectedPlace =
    selectedPlaceId
      ? TRIP.days.flatMap((d) => d.places).find((p) => p.id === selectedPlaceId) ?? null
      : null;
  const selectedPlaceDayId = selectedPlace
    ? TRIP.days.find((d) => d.places.some((p) => p.id === selectedPlace.id))?.id ?? null
    : null;

  // All places for the selected day group (e.g. day 1 includes day 2's places)
  const selectedGroupDayIds = getGroupDayIds(selectedDayId);
  const selectedGroupPlaces = TRIP.days
    .filter((d) => selectedGroupDayIds.includes(d.id))
    .flatMap((d) => d.places);

  const handleMarkerClick = useCallback((place: Place) => {
    setSelectedPlaceId(place.id);
    setSheetOpen(true);
    const placeDayId = TRIP.days.find((d) => d.places.some((p) => p.id === place.id))?.id ?? 1;
    onPlaceClick?.(place.id, placeDayId);
    // Update URL so a back navigation from /place restores state
    const url = new URL(window.location.href);
    url.searchParams.set("place", place.id);
    window.history.replaceState({}, "", url.toString());
  }, [onPlaceClick]);

  // Sync controlled placeId from parent (desktop layout).
  useEffect(() => {
    if (controlledPlaceId === undefined) return;
    setSelectedPlaceId(controlledPlaceId);
  }, [controlledPlaceId]);

  useEffect(() => {
    if (typeof window === "undefined" || leafletRef.current) return;

    import("leaflet").then((L) => {
      if (!mapRef.current || leafletRef.current) return;

      const proto = L.Icon.Default.prototype as unknown as Record<string, unknown>;
      delete proto._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!, {
        center: [35.24, 24.9],
        zoom: 9,
        zoomControl: false,
        attributionControl: true,
      });

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      leafletRef.current = map;
      setMapReady(true);

      const ro = new ResizeObserver(() => map.invalidateSize());
      ro.observe(mapRef.current);
      const t1 = setTimeout(() => map.invalidateSize(), 50);
      const t2 = setTimeout(() => map.invalidateSize(), 250);
      const t3 = setTimeout(() => map.invalidateSize(), 800);
      (map as unknown as { _cleanup?: () => void })._cleanup = () => {
        ro.disconnect();
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };

      // Center on selected place only when NOT in route mode (route mode fitBounds handles it)
      if (initialPlaceId && !initialRouteMode) {
        const place = TRIP.days.flatMap((d) => d.places).find((p) => p.id === initialPlaceId);
        if (place) {
          setTimeout(() => map.setView([place.lat, place.lng], 13, { animate: false }), 100);
        }
      }
    });

    return () => {
      if (leafletRef.current) {
        const m = leafletRef.current as { remove: () => void; _cleanup?: () => void };
        m._cleanup?.();
        m.remove();
        leafletRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render markers when day or mode changes
  useEffect(() => {
    if (!mapReady || !leafletRef.current) return;

    import("leaflet").then((L) => {
      const map = leafletRef.current as ReturnType<typeof L.map>;

      markersRef.current.forEach((m) => (m as { remove: () => void }).remove());
      markersRef.current = [];
      if (polylineRef.current) {
        (polylineRef.current as { remove: () => void }).remove();
        polylineRef.current = null;
      }

      const tones = DAY_TONES[selectedDayId - 1];

      const placesToRender = routeMode
        ? selectedGroupPlaces
        : TRIP.days.flatMap((d) => d.places);

      // Polyline for route mode
      if (routeMode) {
        const coords: [number, number][] = selectedGroupPlaces.map((p) => [p.lat, p.lng]);
        if (coords.length > 1) {
          polylineRef.current = L.polyline(coords, {
            color: tones[1],
            weight: 3,
            opacity: 0.85,
            dashArray: "6 4",
          }).addTo(map);
        }
        if (coords.length > 0) {
          map.fitBounds(L.latLngBounds(coords), { padding: [60, 60] });
        }
      }

      placesToRender.forEach((place, i) => {
        const dayId = TRIP.days.find((d) => d.places.some((p) => p.id === place.id))?.id ?? 1;
        const dayTones = DAY_TONES[dayId - 1];
        const photo = getHeroPhotoForPlace(place.id);
        const photoUrl = photo?.url ? thumbnailUrl(photo.url, 96) : null;

        const numberBadge = routeMode
          ? `<div style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;background:${tones[1]};border:2px solid white;color:white;font-family:monospace;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;">${i + 1}</div>`
          : "";

        const fallback = `<div style="width:100%;height:100%;background:linear-gradient(135deg,${dayTones[0]},${dayTones[1]});display:flex;align-items:center;justify-content:center;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="m4 18 5-5 5 4 3-3 3 3"/></svg></div>`;

        const inner = photoUrl
          ? `<img src="${photoUrl}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" />`
          : fallback;

        const isSelected = place.id === selectedPlaceId;
        const ring = isSelected
          ? `box-shadow:0 0 0 3px var(--terracotta), 0 4px 10px rgba(0,0,0,0.25);`
          : `box-shadow:0 2px 6px rgba(0,0,0,0.25);`;

        const pinHtml = `
          <div style="position:relative;width:48px;height:48px;cursor:pointer;">
            <div style="width:48px;height:48px;border-radius:12px;overflow:hidden;border:2px solid white;${ring}background:white;">
              ${inner}
            </div>
            ${numberBadge}
          </div>`;

        const icon = L.divIcon({
          html: pinHtml,
          className: "",
          iconSize: [48, 48],
          iconAnchor: [24, 48],
        });

        const marker = L.marker([place.lat, place.lng], { icon })
          .addTo(map)
          .on("click", () => handleMarkerClick(place));

        markersRef.current.push(marker);
      });
    });
  }, [mapReady, selectedDayId, routeMode, selectedPlaceId, selectedGroupPlaces, handleMarkerClick]);

  // Reset view when leaving route mode
  useEffect(() => {
    if (!mapReady || !leafletRef.current || routeMode) return;
    if (selectedPlaceId) return; // keep zoomed-in view if a place is selected
    import("leaflet").then((L) => {
      (leafletRef.current as ReturnType<typeof L.map>).flyTo([35.24, 24.9], 9, { duration: 0.8 });
    });
  }, [routeMode, mapReady, selectedPlaceId]);

  useImperativeHandle(ref, () => ({
    zoomIn: () => { (leafletRef.current as { zoomIn?: () => void } | null)?.zoomIn?.(); },
    zoomOut: () => { (leafletRef.current as { zoomOut?: () => void } | null)?.zoomOut?.(); },
  }));

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column" }}>
      {/* Top bar: route toggle + (if active) day chips */}
      {!hideMobileChrome && (
      <div className="crete-map-mobile-chrome" style={{ background: "var(--paper)", borderBottom: "1px solid var(--paper-2)", flexShrink: 0, zIndex: 500 }}>
        <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <span className="eyebrow" style={{ flex: 1 }}>Mode parcours</span>
          <button
            role="switch"
            aria-checked={routeMode}
            onClick={() => setRouteMode((v) => !v)}
            style={{
              width: 44, height: 26, borderRadius: 100,
              background: routeMode ? "var(--ink)" : "var(--paper-3)",
              border: "none", cursor: "pointer", padding: 3,
              display: "flex", alignItems: "center",
              transition: "background 0.2s",
            }}
          >
            <div
              style={{
                width: 20, height: 20, borderRadius: "50%",
                background: "white",
                transform: routeMode ? "translateX(18px)" : "translateX(0)",
                transition: "transform 0.2s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }}
            />
          </button>
        </div>
        {routeMode && (
          <div className="h-scroll" style={{ padding: "0 16px 10px" }}>
            {visibleDays.map((day) => {
              const groupIds = getGroupDayIds(day.id);
              const label = groupIds.length > 1 ? `J${groupIds.join("+")}` : `J${day.id}`;
              return (
                <button
                  key={day.id}
                  onClick={() => setSelectedDayId(day.id)}
                  style={{
                    flexShrink: 0, padding: "6px 14px", borderRadius: 100, border: "none", cursor: "pointer",
                    fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.06em",
                    background: selectedDayId === day.id ? "var(--ink)" : "var(--paper-2)",
                    color: selectedDayId === day.id ? "var(--paper)" : "var(--ink-2)",
                    transition: "all 0.15s",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>
      )}

      {/* Map */}
      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
        <div ref={mapRef} style={{ position: "absolute", inset: 0, background: "var(--paper-2)" }} />
      </div>

      {/* Bottom sheet (handle always visible) */}
      {!hideMobileChrome && (
        <PlaceSheet
          place={selectedPlace}
          dayId={selectedPlaceDayId}
          open={sheetOpen}
          onToggle={() => setSheetOpen((v) => !v)}
          onClose={() => {
            setSheetOpen(false);
            setSelectedPlaceId(null);
            const url = new URL(window.location.href);
            url.searchParams.delete("place");
            window.history.replaceState({}, "", url.toString());
          }}
        />
      )}
    </div>
  );
});

CreteMap.displayName = "CreteMap";
