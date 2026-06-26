"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { type Day } from "@/data/trip";
import { getPhotosForDay } from "@/lib/photos";
import { Icon } from "@/components/icons";
import { type CreteMapHandle } from "@/components/crete-map";

const CreteMap = dynamic(
  () => import("@/components/crete-map").then((m) => m.CreteMap),
  { ssr: false, loading: () => <div style={{ flex: 1, background: "var(--paper-2)" }} /> }
);

export function DesktopMapCanvas({
  day,
  selectedPlaceId,
  mapMode,
  onChangeMode,
  onPlaceClick,
}: {
  day: Day;
  selectedPlaceId: string | undefined;
  mapMode: "photos" | "route";
  onChangeMode: (m: "photos" | "route") => void;
  onPlaceClick?: (placeId: string, dayId: number) => void;
}) {
  const mapRef = useRef<CreteMapHandle>(null);
  const totalPhotos = getPhotosForDay(day.id).length;

  return (
    <div className="dt-map-wrap">
      <div className="dt-map map-tile-topo">
        {/* The actual Leaflet map — key forces remount when day or mode changes
            so fitBounds re-runs for the new day's coords. */}
        <div style={{ position: "absolute", inset: 0 }}>
          <CreteMap
            ref={mapRef}
            key={`${day.id}-${mapMode}`}
            initialDayId={day.id}
            initialPlaceId={selectedPlaceId}
            initialRouteMode={mapMode === "route"}
            selectedPlaceId={selectedPlaceId ?? null}
            onPlaceClick={onPlaceClick}
            hideMobileChrome
          />
        </div>

        {/* ── Decorative overlays ───────────────────────── */}

        {/* Compass rose */}
        <div className="dt-compass">
          <svg viewBox="0 0 100 100" width="68" height="68" aria-hidden>
            <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(26,20,16,0.35)" strokeWidth="1" />
            <circle cx="50" cy="50" r="38" fill="rgba(245,237,224,0.7)" />
            <path d="M50 12 L54 50 L50 88 L46 50 Z" fill="var(--terracotta)" opacity="0.85" />
            <path d="M12 50 L50 46 L88 50 L50 54 Z" fill="var(--ink)" opacity="0.55" />
            <text x="50" y="22" textAnchor="middle" fontSize="9" fontFamily="Fraunces" fill="var(--ink)" fontWeight="600">
              N
            </text>
          </svg>
        </div>

        {/* Mode toggle */}
        <div className="dt-map-mode">
          <button
            type="button"
            className={mapMode === "photos" ? "on" : ""}
            onClick={() => onChangeMode("photos")}
          >
            <Icon.Photo s={14} /> Tous les lieux
          </button>
          <button
            type="button"
            className={mapMode === "route" ? "on" : ""}
            onClick={() => onChangeMode("route")}
          >
            <Icon.Walk s={14} /> Parcours du jour
          </button>
        </div>

        {/* Zoom controls */}
        <div className="dt-map-zoom">
          <button
            type="button"
            aria-label="Zoomer"
            onClick={() => mapRef.current?.zoomIn()}
          >
            <Icon.Plus s={14} />
          </button>
          <div className="dt-zoom-sep" />
          <button
            type="button"
            aria-label="Dézoomer"
            onClick={() => mapRef.current?.zoomOut()}
          >
            <Icon.Minus s={14} />
          </button>
        </div>

        {/* Bottom legend */}
        <div className="dt-map-legend">
          <span className="eyebrow">Jour {day.id}</span>
          <span className="serif dt-legend-title">{day.title}</span>
          <span className="dt-legend-stats">
            <span>
              <Icon.Walk s={12} c="var(--ink-3)" /> {day.km} km
            </span>
            <span>
              <Icon.Pin s={12} c="var(--ink-3)" /> {day.places.length} lieux
            </span>
            <span>
              <Icon.Photo s={12} c="var(--ink-3)" /> {totalPhotos} photos
            </span>
          </span>
        </div>

        {/* Decorative scale */}
        <div className="dt-map-scale">
          <div className="dt-scale-bar">
            <div />
            <div />
            <div />
          </div>
          <div className="dt-scale-lbl">0    25    50 km</div>
        </div>

        {/* Sea labels */}
        <div className="dt-sea-label se">Mer de Libye</div>
        <div className="dt-sea-label ne">Mer de Crète</div>
      </div>
    </div>
  );
}
