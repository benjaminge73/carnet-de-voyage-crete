import { notFound } from "next/navigation";
import Link from "next/link";
import { TRIP, DAY_TONES, KIND_LABEL, MERGED_INTO, MERGED_CHILD_IDS } from "@/data/trip";
import { getPhotosForDay, getPhotoCount, getHeroPhotoForPlace } from "@/lib/photos";
import { Photo } from "@/components/photo";
import { PhotoGrid } from "@/components/photo-grid";
import { Icon } from "@/components/icons";
import { BackButton } from "@/components/back-button";
import { HomeButton } from "@/components/home-button";
import { ScrollRestore } from "@/components/scroll-restore";
import { DesktopApp } from "@/components/desktop/desktop-app";

export function generateStaticParams() {
  return TRIP.days.map((d) => ({ id: String(d.id) }));
}

export default async function DayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const day = TRIP.days.find((d) => d.id === Number(id));
  if (!day) notFound();

  const mergedDayIds = MERGED_INTO[day.id] ?? [];
  const mergedDays = mergedDayIds
    .map((mid) => TRIP.days.find((d) => d.id === mid))
    .filter((d): d is NonNullable<typeof d> => Boolean(d));
  const allDays = [day, ...mergedDays];
  const allPlaces = allDays.flatMap((d) => d.places);

  const tones = DAY_TONES[day.id - 1];
  const allPhotos = allDays.flatMap((d) => getPhotosForDay(d.id));

  return (
    <>
      <div className="desktop-only">
        <DesktopApp initialDay={day.id} />
      </div>
      <div className="app-shell mobile-only">
      <ScrollRestore />
      {/* Header */}
      <div className="app-header">
        <BackButton fallbackHref="/" />
        <div style={{ textAlign: "center" }}>
          <div className="eyebrow eyebrow-terra">Jour {day.id} · {day.stage}</div>
        </div>
        <HomeButton />
      </div>

      <div className="scroll-area">
        {/* Title */}
        <div style={{ padding: "0 20px 16px" }}>
          <div className="eyebrow" style={{ marginBottom: 4 }}>{day.weekday} {day.date}</div>
          <h1 className="serif" style={{ fontSize: 36, fontWeight: 500, margin: 0, lineHeight: 1, letterSpacing: "-0.02em" }}>
            {day.title}
          </h1>
          <p style={{ marginTop: 12, fontSize: 15, lineHeight: 1.55, color: "var(--ink-2)" }}>{day.summary}</p>
        </div>

        {/* Mini-map link */}
        <div style={{ padding: "0 20px 20px" }}>
          <Link href={`/map?day=${day.id}&route=1`} style={{ textDecoration: "none" }}>
            <div className="card" style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
              <Icon.Map s={18} c="var(--aegean)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-2)" }}>Voir sur la carte</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)", marginTop: 2 }}>
                  {allDays.reduce((s, d) => s + d.km, 0)} km · {allPlaces.length} arrêts
                </div>
              </div>
              <Icon.Chevron s={12} c="var(--ink-3)" />
            </div>
          </Link>
        </div>

        {/* Places */}
        <div style={{ padding: "0 20px 20px" }}>
          <div className="divider-rule" style={{ marginBottom: 14 }}>Les lieux</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {allPlaces.map((p, i) => {
              const heroPhoto = getHeroPhotoForPlace(p.id);
              const count = getPhotoCount(p.id);
              return (
                <Link key={p.id} href={`/place/${p.id}`} id={p.id} style={{ textDecoration: "none", scrollMarginTop: 80 }}>
                  <div className="place-card">
                    <div style={{ position: "relative" }}>
                      <Photo
                        url={heroPhoto?.url}
                        tones={tones}
                        ratio="16:9"
                        style={{ borderRadius: 0 }}
                        label={heroPhoto ? undefined : p.name}
                      />
                      <div style={{
                        position: "absolute", top: 12, left: 12,
                        width: 28, height: 28, borderRadius: "50% 50% 50% 0",
                        background: "var(--terracotta)", transform: "rotate(-45deg)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "white", fontFamily: "var(--serif)", fontSize: 13, fontWeight: 600,
                        border: "2px solid white",
                      }}>
                        <span style={{ transform: "rotate(45deg)" }}>{i + 1}</span>
                      </div>
                      <span className="badge" style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)" }}>
                        {KIND_LABEL[p.kind]}
                      </span>
                    </div>
                    <div style={{ padding: "14px 16px" }}>
                      <div className="serif" style={{ fontSize: 19, fontWeight: 500, lineHeight: 1.2 }}>{p.name}</div>
                      <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4, lineHeight: 1.5 }}>
                        {p.context.slice(0, 110)}…
                      </div>
                      <div style={{ marginTop: 10, display: "flex", gap: 6, alignItems: "center", fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.08em", color: "var(--terracotta)", textTransform: "uppercase", fontWeight: 500 }}>
                        <Icon.Photo s={12} /> {count} médias
                        <span style={{ flex: 1 }} />
                        <span>Lire <Icon.Chevron s={11} /></span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Gallery */}
        {allPhotos.length > 0 && (
          <div style={{ padding: "0 20px 24px" }}>
            <div className="divider-rule" style={{ marginBottom: 14 }}>
              Galerie · {allPhotos.length} médias
            </div>
            <PhotoGrid photos={allPhotos} dayId={day.id} tones={tones} />
          </div>
        )}

        {/* Day nav */}
        <div style={{ padding: "0 20px 32px", display: "flex", gap: 10 }}>
          {(() => {
            const visibleDays = TRIP.days.filter((d) => !MERGED_CHILD_IDS.has(d.id));
            const idx = visibleDays.findIndex((d) => d.id === day.id);
            const prev = idx > 0 ? visibleDays[idx - 1] : null;
            const next = idx >= 0 && idx < visibleDays.length - 1 ? visibleDays[idx + 1] : null;
            return (
              <>
                {prev && (
                  <Link href={`/day/${prev.id}`} style={{ textDecoration: "none", flex: 1 }}>
                    <div className="btn btn-ghost" style={{ width: "100%", padding: "14px 16px", justifyContent: "flex-start", gap: 8 }}>
                      <Icon.Chevron s={14} dir="left" />
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.6 }}>Jour {prev.id}</div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{prev.title.slice(0, 16)}</div>
                      </div>
                    </div>
                  </Link>
                )}
                {next && (
                  <Link href={`/day/${next.id}`} style={{ textDecoration: "none", flex: 1 }}>
                    <div className="btn btn-ghost" style={{ width: "100%", padding: "14px 16px", justifyContent: "flex-end", gap: 8 }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.6 }}>Jour {next.id}</div>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{next.title.slice(0, 16)}</div>
                      </div>
                      <Icon.Chevron s={14} />
                    </div>
                  </Link>
                )}
              </>
            );
          })()}
        </div>
      </div>
      </div>
    </>
  );
}
