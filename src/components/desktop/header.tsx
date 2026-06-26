"use client";

import { TRIP } from "@/data/trip";
import { getTotalPhotoCount } from "@/lib/photos";

const NAV_TABS = [
  { id: "carte", label: "Carte" },
  { id: "galerie", label: "Galerie" },
] as const;

function CreteSilhouette() {
  return (
    <svg viewBox="0 0 40 16" width="40" height="16" aria-hidden>
      <path
        d="M1,9 Q2,6 5,5.5 Q8,4 10,5 Q12,3.5 15,4 Q18,3 21,4 Q24,3.5 27,4.5 Q30,4 33,5 Q36,5 38,7 Q39.5,9 38,11 Q35,12 31,11.5 Q27,12 23,11.5 Q19,12 15,11.5 Q11,12 7,11.5 Q3,11.5 1.5,10 Q0.5,9.5 1,9 Z"
        fill="var(--terracotta)"
      />
    </svg>
  );
}

function Stat({ n, l }: { n: string | number; l: string }) {
  return (
    <div className="dt-stat">
      <span className="serif dt-stat-n">{n}</span>
      <span className="dt-stat-l">{l}</span>
    </div>
  );
}

export function DesktopHeader({
  activeNav,
  onChangeNav,
}: {
  activeNav: string;
  onChangeNav: (id: string) => void;
}) {
  const totalPlaces = TRIP.days.flatMap((d) => d.places).length;
  const totalPhotos = getTotalPhotoCount();

  return (
    <header className="dt-header">
      <div className="dt-header-left">
        <div className="dt-logo">
          <div className="dt-logo-mark">
            <CreteSilhouette />
          </div>
          <div className="dt-logo-text">
            <div className="serif dt-logo-title">Crète</div>
            <div className="eyebrow">Carnet de voyage</div>
          </div>
        </div>
        <div className="dt-divider-v" />
        <nav className="dt-nav">
          {NAV_TABS.map((t) => (
            <button
              key={t.id}
              className={`dt-nav-btn ${activeNav === t.id ? "active" : ""}`}
              onClick={() => onChangeNav(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="dt-header-right">
        <div className="dt-stats">
          <Stat n={TRIP.days.length} l="jours" />
          <Stat n={totalPlaces} l="lieux" />
          <Stat n={totalPhotos} l="photos" />
          <Stat n={TRIP.totalKm} l="km" />
        </div>
      </div>
    </header>
  );
}
