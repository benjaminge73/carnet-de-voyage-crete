import Link from "next/link";
import { TRIP, DAY_TONES } from "@/data/trip";
import { getPhotosForDay, getTotalPhotoCount } from "@/lib/photos";
import { Photo } from "@/components/photo";
import { BackButton } from "@/components/back-button";
import { HomeButton } from "@/components/home-button";
import { ScrollRestore } from "@/components/scroll-restore";
import { DesktopApp } from "@/components/desktop/desktop-app";

export default function GalleryPage() {
  const groups = TRIP.days.map((d, i) => ({
    day: d,
    tones: DAY_TONES[i] ?? DAY_TONES[0],
    photos: getPhotosForDay(d.id),
  }));
  const totalCount = getTotalPhotoCount();

  return (
    <>
      <div className="desktop-only">
        <DesktopApp initialDay={1} />
      </div>
      <div className="app-shell mobile-only">
        <ScrollRestore />
        <div className="app-header">
          <BackButton fallbackHref="/" />
          <div style={{ textAlign: "center" }}>
            <div className="eyebrow eyebrow-terra">Galerie</div>
          </div>
          <HomeButton />
        </div>

        <div className="scroll-area">
          <div style={{ padding: "0 20px 16px" }}>
            <h1
              className="serif"
              style={{
                fontSize: 36,
                fontWeight: 500,
                margin: 0,
                lineHeight: 1,
                letterSpacing: "-0.02em",
              }}
            >
              {totalCount} photos &amp; vidéos
            </h1>
          </div>

          {groups.map(({ day, tones, photos }) => {
            if (photos.length === 0) return null;
            return (
              <section key={day.id} style={{ padding: "0 20px 24px" }}>
                <div className="divider-rule" style={{ marginBottom: 14 }}>
                  Jour {day.id} · {day.title} · {photos.length}
                </div>
                <div className="photo-grid">
                  {photos.map((photo, i) => (
                    <Link
                      key={photo.url}
                      href={`/day/${day.id}/lightbox/${i}`}
                      style={{ textDecoration: "none" }}
                    >
                      <Photo
                        url={photo.url}
                        kind={photo.kind}
                        tones={tones}
                        ratio="1"
                        style={{ borderRadius: 6 }}
                      />
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
