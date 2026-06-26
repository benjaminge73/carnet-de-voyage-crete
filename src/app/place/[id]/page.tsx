import { notFound } from "next/navigation";
import Link from "next/link";
import { TRIP, DAY_TONES, KIND_LABEL } from "@/data/trip";
import { getPhotosForPlace, getPhotosForDay, getPhotoCount, getHeroPhotoForPlace } from "@/lib/photos";
import { Photo } from "@/components/photo";
import { PhotoGrid } from "@/components/photo-grid";
import { Icon } from "@/components/icons";
import { PlaceBackButton } from "@/components/place-back-button";
import { HomeButton } from "@/components/home-button";
import { ScrollRestore } from "@/components/scroll-restore";
import { DesktopApp } from "@/components/desktop/desktop-app";

export function generateStaticParams() {
  return TRIP.days.flatMap((d) => d.places.map((p) => ({ id: p.id })));
}

export default async function PlacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let day = null, place = null;
  for (const d of TRIP.days) {
    const p = d.places.find((p) => p.id === id);
    if (p) { day = d; place = p; break; }
  }
  if (!place || !day) notFound();

  const tones = DAY_TONES[day.id - 1];
  const photos = getPhotosForPlace(place.id);
  const allDayPhotos = getPhotosForDay(day.id);
  const count = getPhotoCount(place.id);
  const heroPhoto = getHeroPhotoForPlace(place.id);

  return (
    <>
      <div className="desktop-only">
        <DesktopApp initialDay={day.id} initialPlaceId={place.id} />
      </div>
      <div className="app-shell mobile-only">
      <ScrollRestore />
      {/* Hero photo */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <Photo
          url={heroPhoto?.url}
          tones={tones}
          style={{ height: 320, borderRadius: 0 }}
          ratio="auto"
          label={heroPhoto ? undefined : place.name}
          width={800}
          priority
        />
        {/* Overlay header */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          padding: "14px 16px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "linear-gradient(180deg, rgba(0,0,0,0.35), transparent)",
        }}>
          <PlaceBackButton />
          <HomeButton variant="overlay" />
        </div>

        {/* Photo dots */}
        {photos.length > 1 && (
          <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5 }}>
            {Array.from({ length: Math.min(5, photos.length) }).map((_, i) => (
              <div key={i} style={{
                width: i === 0 ? 18 : 5, height: 5, borderRadius: 100,
                background: i === 0 ? "white" : "rgba(255,255,255,0.5)",
              }} />
            ))}
          </div>
        )}
      </div>

      <div className="scroll-area" style={{ background: "var(--shell)", borderRadius: "24px 24px 0 0", marginTop: -24, position: "relative", zIndex: 2 }}>
        <div style={{ padding: "20px 20px 0" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span className="badge badge-terra">{KIND_LABEL[place.kind]}</span>
            <span className="badge badge-aegean">Jour {day.id} · {day.stage}</span>
          </div>
          <h1 className="serif" style={{ fontSize: 32, fontWeight: 500, margin: "12px 0 4px", lineHeight: 1.05, letterSpacing: "-0.02em" }}>
            {place.name}
          </h1>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.1em", color: "var(--ink-3)", textTransform: "uppercase" }}>
            {place.lat.toFixed(4)}°N · {place.lng.toFixed(4)}°E
          </div>
        </div>

        {/* Context */}
        <div style={{ padding: "20px 20px 0" }}>
          <div style={{ background: "white", borderRadius: 18, padding: 18, border: "1px solid rgba(26,20,16,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, color: "var(--terracotta)" }}>
              <Icon.Info s={16} />
              <span className="eyebrow eyebrow-terra">Le saviez-vous ?</span>
            </div>
            <p style={{ fontFamily: "var(--serif)", fontSize: 17, lineHeight: 1.5, color: "var(--ink)", margin: 0, fontWeight: 400 }}>
              {place.context}
            </p>
          </div>
        </div>

        {/* Personal note */}
        <div style={{ padding: "20px 20px 0" }}>
          <div className="card" style={{ padding: 16, background: "var(--paper-2)", border: "1px solid rgba(200, 85, 61, 0.15)", position: "relative" }}>
            <div style={{ position: "absolute", top: -10, left: 16, fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.14em", color: "var(--terracotta)", textTransform: "uppercase", background: "var(--paper-2)", padding: "2px 8px", fontWeight: 500 }}>
              Notre passage
            </div>
            <p style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 15, lineHeight: 1.55, color: "var(--ink-2)", margin: 0 }}>
              {day.summary}
            </p>
            <div style={{ marginTop: 10, fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.08em", color: "var(--ink-3)", textTransform: "uppercase" }}>
              {day.date} · {day.stage}
            </div>
          </div>
        </div>

        {/* Map link */}
        <div style={{ padding: "20px 20px 0" }}>
          <Link href={`/map?day=${day.id}&place=${place.id}&route=1`} style={{ textDecoration: "none" }}>
            <div className="card" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <Icon.Map s={18} c="var(--aegean)" />
              <span style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-2)" }}>
                Voir sur la carte
              </span>
              <Icon.Chevron s={12} c="var(--ink-3)" />
            </div>
          </Link>
        </div>

        {/* Photo gallery */}
        <div style={{ padding: "20px 20px 28px" }}>
          <div className="divider-rule" style={{ marginBottom: 12 }}>
            {count} médias
          </div>
          {photos.length > 0 ? (
            <PhotoGrid
              photos={photos}
              dayId={day!.id}
              tones={tones}
              referencePhotos={allDayPhotos}
            />
          ) : (
            <div className="photo-grid">
              {Array.from({ length: place.mediaCount }).map((_, i) => (
                <Photo key={i} tones={tones} ratio="1" style={{ borderRadius: 6 }} />
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
