"use client";

import Link from "next/link";
import {
  TRIP,
  type Day,
  type Place,
  DAY_TONES,
  KIND_LABEL,
  mergedDayIdsFor,
} from "@/data/trip";
import { getPhotosForPlace, getPhotosForDay, getPhotoCount } from "@/lib/photos";

function getMergedDayPhotos(dayId: number) {
  const ids = mergedDayIdsFor(dayId).filter((id) => TRIP.days.some((d) => d.id === id));
  return ids.flatMap((id) => getPhotosForDay(id));
}
import { Photo } from "@/components/photo";
import { Icon } from "@/components/icons";

export function DesktopDetailPanel({
  day,
  place,
  dayIndex,
  onSelectPlace,
}: {
  day: Day;
  place: Place;
  dayIndex: number;
  onSelectPlace: (id: string) => void;
}) {
  const tones = DAY_TONES[dayIndex] ?? DAY_TONES[0];
  const totalPhotos = day.places.reduce((s, p) => s + getPhotoCount(p.id), 0);
  const focusPhotos = getPhotosForPlace(place.id).slice(0, 6);

  // Hero cover photo: first real photo of the day, falls back to gradient.
  const dayPhotos = getMergedDayPhotos(day.id);
  const heroPhoto = dayPhotos.find((p) => p.kind !== "video") ?? null;

  // Map a focus photo back to the index it has within the day's pellicule,
  // so the lightbox opens on the same image when clicked from the right grid.
  const dayPhotoIndexByUrl = new Map<string, number>();
  dayPhotos.forEach((p, i) => dayPhotoIndexByUrl.set(p.url, i));

  return (
    <aside className="dt-detail">
      {/* Hero */}
      <div
        className="dt-hero"
        style={
          heroPhoto
            ? {
                backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%), url(${heroPhoto.url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }
            : {
                background: `linear-gradient(150deg, ${tones[0]} 0%, ${tones[1]} 100%)`,
              }
        }
      >
        {!heroPhoto && <div className="dt-hero-stripe" />}
        <div className="dt-hero-content">
          <div className="dt-hero-top">
            <span className="dt-hero-day">Jour {day.id}</span>
            <span
              className="stamp"
              style={{
                background: "rgba(255,255,255,0.18)",
                color: "#fff",
                borderColor: "rgba(255,255,255,0.55)",
              }}
            >
              <Icon.Sun s={10} c="#fff" /> {day.stage}
            </span>
          </div>
          <h1 className="serif dt-hero-title">{day.title}</h1>
          <div className="dt-hero-meta">
            <span>
              {day.weekday}. {day.date}
            </span>
            <span className="dt-dot" />
            <span>{day.km} km</span>
            <span className="dt-dot" />
            <span>{totalPhotos} photos</span>
          </div>
        </div>
      </div>

      {/* Récit */}
      <div className="dt-section">
        <div className="eyebrow eyebrow-terra">Récit</div>
        <p className="dt-summary serif">{day.summary}</p>
      </div>

      {/* Étapes du jour */}
      <div className="dt-section">
        <div className="dt-section-head">
          <div className="eyebrow">Étapes du jour</div>
          <span className="dt-section-count">{day.places.length}</span>
        </div>
        <div className="dt-places">
          {day.places.map((p, i) => (
            <button
              key={p.id}
              className={`dt-place ${p.id === place.id ? "active" : ""}`}
              onClick={() => onSelectPlace(p.id)}
            >
              <div className="dt-place-num serif">{i + 1}</div>
              <div className="dt-place-body">
                <div className="dt-place-name serif">{p.name}</div>
                <div className="dt-place-meta">
                  <span className="badge">{KIND_LABEL[p.kind]}</span>
                  <span className="dt-place-photos">
                    <Icon.Photo s={11} c="var(--ink-3)" /> {getPhotoCount(p.id)}
                  </span>
                </div>
              </div>
              <Icon.Chevron s={14} c="var(--ink-3)" />
            </button>
          ))}
        </div>
      </div>

      {/* Focus place */}
      <div className="dt-section dt-section-focus">
        <div className="eyebrow eyebrow-terra">À propos · {place.name}</div>
        <p className="dt-context">{place.context}</p>

        <div className="dt-place-photos-grid">
          {focusPhotos.length > 0
            ? focusPhotos.map((photo, i) => {
                const lightboxIndex = dayPhotoIndexByUrl.get(photo.url) ?? 0;
                const span = i === 0;
                return (
                  <Link
                    key={photo.url}
                    href={`/day/${day.id}/lightbox/${lightboxIndex}`}
                    style={{
                      display: "block",
                      textDecoration: "none",
                      ...(span ? { gridColumn: "span 2", gridRow: "span 2" } : {}),
                    }}
                  >
                    <Photo
                      url={photo.url}
                      kind={photo.kind}
                      tones={tones}
                      ratio={span ? "4:3" : "1"}
                      width={span ? 400 : 200}
                    />
                  </Link>
                );
              })
            : Array.from({ length: Math.min(place.mediaCount, 6) }).map((_, i) => (
                <Photo
                  key={i}
                  tones={tones}
                  ratio={i === 0 ? "4:3" : "1"}
                  style={i === 0 ? { gridColumn: "span 2", gridRow: "span 2" } : {}}
                />
              ))}
        </div>
      </div>
    </aside>
  );
}
