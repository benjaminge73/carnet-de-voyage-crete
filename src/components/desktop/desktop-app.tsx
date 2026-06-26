"use client";

import { useEffect, useState } from "react";
import { TRIP, MERGED_INTO, MERGED_FROM, type Day } from "@/data/trip";
import { DesktopHeader } from "./header";
import { DesktopSidebar } from "./sidebar";
import { DesktopMapCanvas } from "./map-canvas";
import { DesktopDetailPanel } from "./detail-panel";
import { DesktopPhotoStrip } from "./photo-strip";
import { DesktopGallery } from "./gallery";

// Returns a synthetic Day with merged children's places concatenated,
// so the sidebar's "Jour 1+2" entry shows all stops in the right panel.
function buildMergedDay(dayId: number): Day {
  const base = TRIP.days.find((d) => d.id === dayId) ?? TRIP.days[0];
  const childIds = MERGED_INTO[dayId] ?? [];
  if (childIds.length === 0) return base;
  const children = childIds
    .map((id) => TRIP.days.find((d) => d.id === id))
    .filter((d): d is Day => Boolean(d));
  const all = [base, ...children];
  return {
    ...base,
    places: all.flatMap((d) => d.places),
    km: all.reduce((s, d) => s + d.km, 0),
    title: all.map((d) => d.title).join(" · "),
  };
}

function getParentDayId(dayId: number): number {
  return MERGED_FROM[dayId] ?? dayId;
}

export function DesktopApp({
  initialDay = 1,
  initialPlaceId,
}: {
  initialDay?: number;
  initialPlaceId?: string;
}) {
  const [selectedDay, setSelectedDay] = useState(getParentDayId(initialDay));
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | undefined>(initialPlaceId);
  const [mapMode, setMapMode] = useState<"photos" | "route">("route");
  const [activeNav, setActiveNav] = useState("carte");

  const day = buildMergedDay(selectedDay);
  const dayIndex = TRIP.days.findIndex((d) => d.id === day.id);
  const place = day.places.find((p) => p.id === selectedPlaceId) ?? day.places[0];

  // When day changes (sidebar click), reset selected place to first of new day
  // unless the selected place still belongs to the new day.
  useEffect(() => {
    if (!day.places.find((p) => p.id === selectedPlaceId)) {
      setSelectedPlaceId(day.places[0]?.id);
    }
  }, [selectedDay, day.places, selectedPlaceId]);

  return (
    <div className="dt-shell">
      <DesktopHeader activeNav={activeNav} onChangeNav={setActiveNav} />
      <div className="dt-body">
        <DesktopSidebar
          selectedDay={day.id}
          onSelectDay={(id) => {
            setSelectedDay(id);
            setMapMode("route");
          }}
        />
        <div className="dt-center">
          {activeNav === "galerie" ? (
            <DesktopGallery />
          ) : (
            <>
              <DesktopMapCanvas
                day={day}
                selectedPlaceId={place?.id}
                mapMode={mapMode}
                onChangeMode={setMapMode}
                onPlaceClick={(placeId, dayId) => {
                  setSelectedDay(getParentDayId(dayId));
                  setSelectedPlaceId(placeId);
                }}
              />
              <DesktopPhotoStrip day={day} dayIndex={dayIndex} />
            </>
          )}
        </div>
        {place && activeNav !== "galerie" && (
          <DesktopDetailPanel
            day={day}
            place={place}
            dayIndex={dayIndex}
            onSelectPlace={setSelectedPlaceId}
          />
        )}
      </div>
    </div>
  );
}
