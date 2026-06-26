"use client";

import NextImage from "next/image";
import { Icon } from "./icons";
import { cfImageUrl, snapWidth } from "@/lib/photos";
import { parseRatio, type RatioInput } from "@/lib/photos/ratio";

interface PhotoProps {
  url?: string | null;
  tones?: [string, string];
  label?: string;
  ratio?: RatioInput;
  style?: React.CSSProperties;
  kind?: "photo" | "video";
  onClick?: () => void;
  children?: React.ReactNode;
  // "cf" (default): serve via Cloudflare Image Resizing with a plain <img>.
  //   Bypasses Vercel's image optimizer to preserve the free-tier quota.
  // "next": use next/image. Reserve for the lightbox / full-screen views.
  optimize?: "cf" | "next";
  // Target display width in CSS px; snapped to a canonical width for cache reuse.
  width?: number;
  priority?: boolean;
}

export function Photo({
  url,
  tones = ["#E8B79A", "#C8553D"],
  label,
  ratio = "1",
  style = {},
  kind = "photo",
  onClick,
  children,
  optimize = "cf",
  width = 400,
  priority = false,
}: PhotoProps) {
  const { css: aspect, value: aspectWH } = parseRatio(ratio);

  const posterUrl = url?.replace(/\.mp4$/i, ".poster.webp") ?? null;

  const renderImg = () => {
    if (!url || kind === "video") return null;
    if (optimize === "next") {
      return (
        <NextImage
          src={url}
          alt={label ?? ""}
          fill
          priority={priority}
          style={{ objectFit: "cover" }}
          sizes="(max-width: 480px) 100vw, 480px"
        />
      );
    }
    const w = snapWidth(width);
    const h = Math.max(1, Math.round(w / aspectWH));
    const src = cfImageUrl(url, { width: w, height: h, quality: 70, resize: "cover" });
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={label ?? ""}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  };

  return (
    <div
      className="photo-ph"
      onClick={onClick}
      style={{
        aspectRatio: aspect,
        background: (url && kind !== "video") ? undefined : `linear-gradient(135deg, ${tones[0]} 0%, ${tones[1]} 100%)`,
        borderRadius: 12,
        position: "relative",
        overflow: "hidden",
        cursor: onClick ? "pointer" : undefined,
        ...style,
      }}
    >
      {renderImg()}
      {url && kind === "video" && (
        <video
          src={url}
          poster={posterUrl ?? undefined}
          preload="none"
          muted
          playsInline
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}
      {kind === "video" && (
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center", paddingLeft: 4,
          }}>
            <Icon.Play s={20} c="white" />
          </div>
        </div>
      )}
      {label && !url && <div className="photo-ph-label">{label}</div>}
      {children}
    </div>
  );
}
