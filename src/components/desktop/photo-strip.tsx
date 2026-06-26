"use client";

import Link from "next/link";
import { TRIP, type Day, DAY_TONES, mergedDayIdsFor } from "@/data/trip";
import { getPhotosForDay } from "@/lib/photos";
import { Photo } from "@/components/photo";

function getMergedPhotos(dayId: number) {
  const ids = mergedDayIdsFor(dayId).filter((id) => TRIP.days.some((d) => d.id === id));
  return ids.flatMap((id) => getPhotosForDay(id));
}

function formatTime(datetime: string | null): string {
  if (!datetime) return "—";
  const m = datetime.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : "—";
}

export function DesktopPhotoStrip({
  day,
  dayIndex,
}: {
  day: Day;
  dayIndex: number;
}) {
  const tones = DAY_TONES[dayIndex] ?? DAY_TONES[0];
  const photos = getMergedPhotos(day.id);

  return (
    <div className="dt-strip">
      <div className="dt-strip-head">
        <div>
          <div className="eyebrow eyebrow-terra">Pellicule · Jour {day.id}</div>
          <div className="serif dt-strip-title">
            {day.places.length} étapes, {photos.length} clichés
          </div>
        </div>
      </div>
      <div className="dt-strip-scroll">
        {photos.map((photo, i) => (
          <Link
            key={photo.url}
            href={`/day/${day.id}/lightbox/${i}`}
            className="dt-strip-item"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <Photo
              url={photo.url}
              kind={photo.kind}
              tones={tones}
              ratio="4:3"
              width={200}
              style={{ width: 168, height: 126 }}
            />
            <div className="dt-strip-caption">
              <span className="dt-strip-place">{day.title}</span>
              <span className="dt-strip-time">{formatTime(photo.datetime)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
