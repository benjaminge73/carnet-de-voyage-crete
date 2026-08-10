import Link from "next/link";
import {
  TRIP,
  DAY_TONES,
  MERGED_INTO,
  MERGED_CHILD_IDS,
  mergedDayIdsFor,
  type Day,
} from "@/data/trip";
import { getTotalPhotoCount, getPhotosForDay, getMediaCountsForDay } from "@/lib/photos";
import { Photo } from "@/components/photo";
import { Icon } from "@/components/icons";
import { ScrollRestore } from "@/components/scroll-restore";
import { DesktopApp } from "@/components/desktop/desktop-app";

// This repo ships without real media (see README): public/photos is empty
// and gitignored, and NEXT_PUBLIC_PHOTOS_BASE_URL defaults to a placeholder,
// unresolvable host. Only build a cover URL when a real photo store is
// actually configured — otherwise the hero falls back to the gradient alone
// instead of pointing the browser at a domain that can never resolve.
const COVER_URL = process.env.NEXT_PUBLIC_PHOTOS_BASE_URL
  ? `${process.env.NEXT_PUBLIC_PHOTOS_BASE_URL}/traveler-1/IMG_7013.jpeg`
  : null;

export default function HomePage() {
  const totalPhotos = getTotalPhotoCount();
  const totalPlaces = TRIP.days.flatMap((d) => d.places).length;

  // Build the rendered list: a single card per parent day (merged children inlined).
  const groups: { days: Day[] }[] = [];
  for (const day of TRIP.days) {
    if (MERGED_INTO[day.id]) {
      const ids = mergedDayIdsFor(day.id);
      groups.push({ days: TRIP.days.filter((d) => ids.includes(d.id)) });
    } else if (!MERGED_CHILD_IDS.has(day.id)) {
      groups.push({ days: [day] });
    }
  }

  return (
    <>
      <div className="desktop-only">
        <DesktopApp initialDay={1} />
      </div>
      <div className="app-shell mobile-only">
      <ScrollRestore />
      <div className="scroll-area">
        {/* Hero */}
        <div
          className="hero-img"
          style={{
            backgroundImage: COVER_URL
              ? `linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%), url(${COVER_URL})`
              : "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div style={{
            position: "absolute", top: 16, left: 20, right: 20,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            color: "rgba(255,255,255,0.95)",
          }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase" }}>
              Carnet de voyage
            </span>
            <span className="stamp" style={{ color: "white", borderColor: "rgba(255,255,255,0.6)" }}>
              AVR 2026
            </span>
          </div>
          <div style={{ position: "absolute", bottom: 24, left: 20, right: 20, color: "white" }}>
            <div className="eyebrow" style={{ color: "rgba(255,255,255,0.85)", marginBottom: 4 }}>
              {TRIP.dates}
            </div>
            <h1 className="serif" style={{ fontSize: 56, fontWeight: 500, margin: 0, lineHeight: 0.95, letterSpacing: "-0.02em" }}>
              {TRIP.title}
            </h1>
            <div style={{
              display: "flex", gap: 14, marginTop: 10,
              fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.1em",
              textTransform: "uppercase", color: "rgba(255,255,255,0.85)",
            }}>
              <span>{TRIP.days.length} jours</span>
              <span>·</span>
              <span>{TRIP.totalKm} km</span>
              <span>·</span>
              <span>{totalPhotos} médias</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ padding: "20px 20px 0", display: "flex", gap: 8 }}>
          {[
            { lbl: "Étapes", val: "4" },
            { lbl: "Lieux", val: totalPlaces },
            { lbl: "Voyageurs", val: TRIP.travelers },
            { lbl: "Médias", val: totalPhotos },
          ].map((s) => (
            <div key={s.lbl} className="card" style={{ flex: 1, padding: "12px 10px", textAlign: "center" }}>
              <div className="serif" style={{ fontSize: 22, fontWeight: 600, color: "var(--terracotta)", lineHeight: 1 }}>
                {s.val}
              </div>
              <div className="eyebrow" style={{ marginTop: 4 }}>{s.lbl}</div>
            </div>
          ))}
        </div>

        {/* Carte */}
        <div style={{ padding: "24px 20px 8px" }}>
          <div className="divider-rule">Carte</div>
        </div>
        <div style={{ padding: "12px 20px 0" }}>
          <Link href="/map" style={{ textDecoration: "none" }}>
            <div className="card" style={{ padding: 18, display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: "linear-gradient(135deg, #A8D0E6, #2E5E7E)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2Z"/><path d="M9 3v16M15 5v16"/>
                </svg>
              </div>
              <div>
                <div className="serif" style={{ fontSize: 17, fontWeight: 500, color: "var(--ink)" }}>Voir la carte</div>
                <div className="eyebrow" style={{ marginTop: 3 }}>{totalPlaces} lieux · tracé du parcours</div>
              </div>
            </div>
          </Link>
        </div>

        {/* Galerie */}
        <div style={{ padding: "24px 20px 8px" }}>
          <div className="divider-rule">Galerie</div>
        </div>
        <div style={{ padding: "12px 20px 0" }}>
          <Link href="/gallery" style={{ textDecoration: "none" }}>
            <div className="card" style={{ padding: 18, display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: "linear-gradient(135deg, #E8B79A, #C8553D)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="9" cy="9" r="2"/>
                  <path d="m21 15-5-5L5 21"/>
                </svg>
              </div>
              <div>
                <div className="serif" style={{ fontSize: 17, fontWeight: 500, color: "var(--ink)" }}>Voir la galerie</div>
                <div className="eyebrow" style={{ marginTop: 3 }}>{totalPhotos} photos &amp; vidéos · {TRIP.days.length} jours</div>
              </div>
            </div>
          </Link>
        </div>

        {/* Itinéraire */}
        <div style={{ padding: "24px 20px 8px" }}>
          <div className="divider-rule">Itinéraire</div>
        </div>

        <div style={{ padding: "12px 20px 32px", display: "flex", flexDirection: "column", gap: 10 }}>
          {groups.map(({ days }) => {
            const firstDay = days[0];
            const tones = DAY_TONES[firstDay.id - 1];
            const allPhotos = days.flatMap((d) => getPhotosForDay(d.id));
            const heroUrl = allPhotos.find((p) => p.kind !== "video")?.url ?? null;
            const places = days.flatMap((d) => d.places);
            const counts = days.reduce(
              (acc, d) => {
                const c = getMediaCountsForDay(d.id);
                return { photos: acc.photos + c.photos, videos: acc.videos + c.videos };
              },
              { photos: 0, videos: 0 }
            );
            const dayLabel =
              days.length > 1
                ? `Jours ${days[0].id}–${days[days.length - 1].id} · ${days[0].weekday} ${days[0].date} → ${days[days.length - 1].date}`
                : `Jour ${firstDay.id} · ${firstDay.weekday} ${firstDay.date}`;
            const title =
              days.length > 1
                ? days.map((d) => d.title).join(" · ")
                : firstDay.title;
            return (
              <Link key={firstDay.id} href={`/day/${firstDay.id}`} style={{ textDecoration: "none" }}>
                <div className="card" style={{ display: "flex", overflow: "hidden", cursor: "pointer", padding: 0 }}>
                  <Photo
                    url={heroUrl}
                    tones={tones}
                    style={{ width: 100, height: 100, borderRadius: 0, flexShrink: 0 }}
                    label={!heroUrl ? `J${firstDay.id}` : undefined}
                  />
                  <div style={{ flex: 1, padding: "12px 14px", display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 0 }}>
                    <div>
                      <div className="eyebrow eyebrow-terra" style={{ fontSize: 10 }}>
                        {dayLabel}
                      </div>
                      <div className="serif" style={{
                        fontSize: 17, fontWeight: 500, color: "var(--ink)",
                        marginTop: 2, lineHeight: 1.15,
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}>
                        {title}
                      </div>
                    </div>
                    <div style={{
                      display: "flex", gap: 8, alignItems: "center",
                      fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.06em",
                      color: "var(--ink-3)", textTransform: "uppercase",
                    }}>
                      <span>{firstDay.stage}</span>
                      <span style={{ opacity: 0.4 }}>·</span>
                      <span>{places.length} lieux</span>
                      <span style={{ opacity: 0.4 }}>·</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                        <Icon.Photo s={11} /> {counts.photos}
                      </span>
                      {counts.videos > 0 && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
                          <Icon.Video s={11} /> {counts.videos}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      </div>
    </>
  );
}
