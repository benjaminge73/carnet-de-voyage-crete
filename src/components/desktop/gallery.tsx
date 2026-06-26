"use client";

import Link from "next/link";
import { TRIP, DAY_TONES } from "@/data/trip";
import { getPhotosForDay } from "@/lib/photos";
import { Photo } from "@/components/photo";

export function DesktopGallery() {
  const groups = TRIP.days.map((d, i) => ({
    day: d,
    tones: DAY_TONES[i] ?? DAY_TONES[0],
    photos: getPhotosForDay(d.id),
  }));
  const totalCount = groups.reduce((s, g) => s + g.photos.length, 0);

  return (
    <div className="dt-gallery">
      <div className="dt-gallery-head">
        <div>
          <div className="eyebrow eyebrow-terra">Galerie</div>
          <div className="serif dt-gallery-title">
            {totalCount} photos &amp; vidéos
          </div>
        </div>
      </div>
      <div className="dt-gallery-scroll">
        {groups.map(({ day, tones, photos }) => (
          <section key={day.id} className="dt-gallery-section">
            <div className="dt-gallery-section-head">
              <span className="eyebrow">Jour {day.id} · {day.weekday} {day.date}</span>
              <span className="serif dt-gallery-section-title">{day.title}</span>
              <span className="dt-gallery-count">{photos.length}</span>
            </div>
            <div className="dt-gallery-grid">
              {photos.map((photo, i) => (
                <Link
                  key={photo.url}
                  href={`/day/${day.id}/lightbox/${i}`}
                  style={{ textDecoration: "none", display: "block" }}
                >
                  <Photo
                    url={photo.url}
                    kind={photo.kind}
                    tones={tones}
                    ratio="1"
                    width={200}
                  />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
