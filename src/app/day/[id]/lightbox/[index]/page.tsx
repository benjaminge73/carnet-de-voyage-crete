"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { TRIP, DAY_TONES, mergedDayIdsFor } from "@/data/trip";
import { getPhotosForDay, thumbnailUrl } from "@/lib/photos";
import { Icon } from "@/components/icons";

export default function LightboxPage({ params }: { params: Promise<{ id: string; index: string }> }) {
  const { id, index } = use(params);
  const router = useRouter();

  const day = TRIP.days.find((d) => d.id === Number(id)) ?? TRIP.days[0];
  const tones = DAY_TONES[day.id - 1];
  const allDays = mergedDayIdsFor(day.id)
    .map((mid) => TRIP.days.find((d) => d.id === mid))
    .filter((d): d is NonNullable<typeof d> => Boolean(d));
  const allPhotos = allDays.flatMap((d) => getPhotosForDay(d.id));

  const [idx, setIdx] = useState(Math.min(Number(index), Math.max(0, allPhotos.length - 1)));
  const [uiHidden, setUiHidden] = useState(false);

  const placeName = day.title;
  const lightboxRef = useRef<HTMLDivElement>(null);

  // Fullscreen API — request true fullscreen on supported browsers (iOS Safari 16.4+)
  const enterFullscreen = async () => {
    setUiHidden(true);
    const el = lightboxRef.current;
    if (!el) return;
    const anyEl = el as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>;
    };
    try {
      if (anyEl.requestFullscreen) await anyEl.requestFullscreen();
      else if (anyEl.webkitRequestFullscreen) await anyEl.webkitRequestFullscreen();
    } catch {
      // Fallback: nudge Safari URL bar away
      if (typeof window !== "undefined") window.scrollTo(0, 1);
    }
  };

  const exitFullscreen = async () => {
    setUiHidden(false);
    const anyDoc = document as Document & {
      webkitExitFullscreen?: () => Promise<void>;
      webkitFullscreenElement?: Element | null;
    };
    try {
      if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen();
      else if (anyDoc.webkitFullscreenElement && anyDoc.webkitExitFullscreen) await anyDoc.webkitExitFullscreen();
    } catch {
      /* noop */
    }
  };

  // Sync uiHidden with browser fullscreen state (ESC, system gesture, etc.)
  useEffect(() => {
    const onFsChange = () => {
      const anyDoc = document as Document & { webkitFullscreenElement?: Element | null };
      const isFs = Boolean(document.fullscreenElement || anyDoc.webkitFullscreenElement);
      setUiHidden(isFs);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  }, []);

  // Track ref for Airbnb-style horizontal slide
  const trackRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef<number>(0);

  function setTrackTranslate(offsetX: number, animated: boolean) {
    if (!trackRef.current) return;
    trackRef.current.style.transition = animated
      ? "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
      : "none";
    trackRef.current.style.transform = `translateX(calc(${-idx} * 100% + ${offsetX}px))`;
  }

  // Sync track position when idx changes (animated snap)
  useEffect(() => {
    if (!trackRef.current) return;
    trackRef.current.style.transition = "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
    trackRef.current.style.transform = `translateX(calc(${-idx} * 100%))`;
  }, [idx]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
    setTrackTranslate(0, false);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    touchDeltaX.current = dx;
    // Rubber-band resistance at first/last photo
    const atEdge = (dx > 0 && idx === 0) || (dx < 0 && idx === allPhotos.length - 1);
    setTrackTranslate(atEdge ? dx * 0.25 : dx, false);
  };

  const onTouchEnd = () => {
    if (touchStartX.current === null) return;
    const dx = touchDeltaX.current;
    touchStartX.current = null;
    const vw = window.innerWidth;
    if (dx < -vw * 0.3 && idx < allPhotos.length - 1) {
      setIdx(idx + 1);
    } else if (dx > vw * 0.3 && idx > 0) {
      setIdx(idx - 1);
    } else {
      setTrackTranslate(0, true);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && idx < allPhotos.length - 1) setIdx(idx + 1);
      if (e.key === "ArrowLeft" && idx > 0) setIdx(idx - 1);
      if (e.key === "Escape") router.back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, allPhotos.length, router]);

  // Pause any playing video when navigating away from its slide
  useEffect(() => {
    if (!trackRef.current) return;
    trackRef.current.querySelectorAll("video").forEach((v) => v.pause());
  }, [idx]);

  // Scroll active thumbnail into view
  const thumbsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const strip = thumbsRef.current;
    if (!strip) return;
    const thumb = strip.children[idx] as HTMLElement | undefined;
    thumb?.scrollIntoView({ inline: "center", behavior: "smooth" });
  }, [idx]);

  return (
    <div className="lightbox" ref={lightboxRef}>
      {/* Photo track — fills entire screen */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={() => { if (Math.abs(touchDeltaX.current) > 10) return; if (uiHidden) exitFullscreen(); else enterFullscreen(); }}
        style={{ position: "absolute", inset: 0, overflow: "hidden" }}
      >
        <div
          ref={trackRef}
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            transform: `translateX(calc(${-idx} * 100%))`,
            willChange: "transform",
          }}
        >
          {allPhotos.map((photo, i) => (
            <div
              key={photo.url}
              style={{ minWidth: "100%", height: "100%", flexShrink: 0, position: "relative" }}
            >
              {photo.kind === "video" ? (
                <video
                  src={photo.url}
                  controls
                  playsInline
                  onClick={(e) => e.stopPropagation()}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
                />
              ) : (
                <Image
                  src={photo.url}
                  alt={placeName}
                  fill
                  style={{ objectFit: "contain" }}
                  sizes="100vw"
                  priority={i === idx}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Exit-fullscreen button — always accessible when UI is hidden */}
      {uiHidden && (
        <button
          onClick={exitFullscreen}
          aria-label="Quitter le plein écran"
          style={{ position: "absolute", top: 16, right: 16, zIndex: 10, width: 36, height: 36, borderRadius: 100, border: "none", background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 3H3v6M15 3h6v6M9 21H3v-6M15 21h6v-6"/>
          </svg>
        </button>
      )}

      {/* Top bar + arrows + thumbnails — hidden when uiHidden */}
      <div style={{ opacity: uiHidden ? 0 : 1, pointerEvents: uiHidden ? "none" : "auto", transition: "opacity 0.2s", visibility: uiHidden ? "hidden" : "visible" }}>
        <div className="lightbox-topbar">
          <button
            onClick={() => router.back()}
            aria-label="Retour"
            style={{ width: 36, height: 36, borderRadius: 100, border: "none", background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <Icon.Close s={18} c="white" />
          </button>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.12em", color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>
              {idx + 1} / {allPhotos.length}
            </div>
            <div className="serif" style={{ fontSize: 15, fontWeight: 500, marginTop: 2, color: "white" }}>{day.title}</div>
          </div>
          <button
            onClick={enterFullscreen}
            aria-label="Plein écran"
            style={{ width: 36, height: 36, borderRadius: 100, border: "none", background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6"/>
            </svg>
          </button>
        </div>

        {/* Navigation arrows */}
        {idx > 0 && (
          <button
            onClick={() => setIdx(idx - 1)}
            aria-label="Précédent"
            style={{ position: "absolute", left: 6, top: "50%", transform: "translateY(-50%)", zIndex: 4, width: 40, height: 40, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <Icon.Chevron s={18} c="white" dir="left" />
          </button>
        )}
        {idx < allPhotos.length - 1 && (
          <button
            onClick={() => setIdx(idx + 1)}
            aria-label="Suivant"
            style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", zIndex: 4, width: 40, height: 40, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <Icon.Chevron s={18} c="white" />
          </button>
        )}
      </div>

      {/* Thumbnails — gradient overlay at bottom */}
      <div style={{ opacity: uiHidden ? 0 : 1, pointerEvents: uiHidden ? "none" : "auto", transition: "opacity 0.2s", visibility: uiHidden ? "hidden" : "visible" }}>
      <div className="lightbox-thumbs">
        <div ref={thumbsRef} className="h-scroll" style={{ gap: 5, padding: "0 14px" }}>
          {allPhotos.map((photo, i) => (
            <button
              key={photo.url}
              onClick={() => setIdx(i)}
              style={{
                width: 44, height: 44, flexShrink: 0, borderRadius: 6, overflow: "hidden", cursor: "pointer", padding: 0, border: "none",
                outline: i === idx ? "2px solid white" : "2px solid transparent",
                opacity: i === idx ? 1 : 0.55,
                position: "relative",
                background: `linear-gradient(135deg, ${tones[0]}, ${tones[1]})`,
              }}
            >
              {photo.kind === "video" ? (
                <div style={{ position: "absolute", inset: 0 }}>
                  <video
                    src={photo.url}
                    preload="metadata"
                    muted
                    playsInline
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onLoadedMetadata={(e) => { (e.target as HTMLVideoElement).currentTime = 0.001; }}
                  />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon.Play s={14} c="white" />
                  </div>
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={thumbnailUrl(photo.url, 88)} alt="" loading="lazy" decoding="async" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              )}
            </button>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
