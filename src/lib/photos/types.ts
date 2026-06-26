export interface PhotoEntry {
  url: string;
  datetime: string | null;
  lat: number | null;
  lng: number | null;
  kind?: "video";
  // Marks photos containing a foreground person (family).
  // Excluded from the rendered set when NEXT_PUBLIC_VARIANT=portfolio.
  family?: boolean;
}

// Build-time site variant. Controlled by NEXT_PUBLIC_VARIANT (baked into the
// client bundle). "portfolio" hides every photo flagged family: true; the
// default "full" mode shows everything.
export type SiteVariant = "full" | "portfolio";

export function getSiteVariant(): SiteVariant {
  return process.env.NEXT_PUBLIC_VARIANT === "portfolio" ? "portfolio" : "full";
}
