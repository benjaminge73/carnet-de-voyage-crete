"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { BackButton } from "@/components/back-button";
import { HomeButton } from "@/components/home-button";
import { DesktopApp } from "@/components/desktop/desktop-app";

const CreteMap = dynamic(
  () => import("@/components/crete-map").then((m) => m.CreteMap),
  { ssr: false, loading: () => <div style={{ flex: 1, background: "var(--paper-2)" }} /> }
);

function MapContent() {
  const params = useSearchParams();
  const dayParam = params.get("day");
  const initialDayId = dayParam ? Number(dayParam) : 1;
  const initialPlaceId = params.get("place") ?? undefined;
  const routeParam = params.get("route");
  const initialRouteMode = routeParam === "1" || routeParam === "true";

  return (
    <>
      <div className="desktop-only">
        <DesktopApp initialDay={initialDayId} initialPlaceId={initialPlaceId} />
      </div>
      <div className="app-shell mobile-only" style={{ height: "100dvh" }}>
        {/* Header */}
        <div className="app-header" style={{ borderBottom: "1px solid var(--paper-2)", flexShrink: 0 }}>
          <BackButton fallbackHref="/" />
          <div className="eyebrow">Carte · Crète</div>
          <HomeButton />
        </div>

        <div style={{ flex: 1, position: "relative", overflow: "hidden", minHeight: 0 }}>
          <CreteMap initialDayId={initialDayId} initialPlaceId={initialPlaceId} initialRouteMode={initialRouteMode} />
        </div>
      </div>
    </>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={<div className="app-shell" />}>
      <MapContent />
    </Suspense>
  );
}
