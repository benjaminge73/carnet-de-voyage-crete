import Link from "next/link";
import { Photo } from "./photo";
import type { PhotoEntry } from "@/lib/photos";

interface PhotoGridProps {
  photos: PhotoEntry[];
  // Day id used to build lightbox links: /day/{dayId}/lightbox/{index}.
  dayId: number;
  tones: [string, string];
  // Photos that make up the full lightbox pellicule for this day.
  // The index of each rendered photo in this list is what the lightbox jumps to.
  // Defaults to `photos` (used by the day page where the grid IS the pellicule).
  // The place page passes the day's full photo list so a click jumps to the
  // right slide in the day-wide lightbox.
  referencePhotos?: PhotoEntry[];
}

export function PhotoGrid({ photos, dayId, tones, referencePhotos }: PhotoGridProps) {
  const ref = referencePhotos ?? photos;
  const indexOf = referencePhotos
    ? (photo: PhotoEntry) => ref.findIndex((p) => p.url === photo.url)
    : (_: PhotoEntry, i: number) => i;

  return (
    <div className="photo-grid">
      {photos.map((photo, i) => (
        <Link
          key={photo.url}
          href={`/day/${dayId}/lightbox/${indexOf(photo, i)}`}
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
  );
}
