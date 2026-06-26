type IconProps = { s?: number; c?: string };

export const Icon = {
  Map: ({ s = 22, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3 3 5v16l6-2 6 2 6-2V3l-6 2-6-2Z"/><path d="M9 3v16M15 5v16"/>
    </svg>
  ),
  Calendar: ({ s = 22, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>
    </svg>
  ),
  Photo: ({ s = 22, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="m4 18 5-5 5 4 3-3 3 3"/>
    </svg>
  ),
  Pin: ({ s = 22, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12Z"/><circle cx="12" cy="10" r="2.5"/>
    </svg>
  ),
  Search: ({ s = 18, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round">
      <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
    </svg>
  ),
  Close: ({ s = 22, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round">
      <path d="M6 6 18 18M18 6 6 18"/>
    </svg>
  ),
  Back: ({ s = 22, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 5-7 7 7 7"/>
    </svg>
  ),
  Chevron: ({ s = 18, c = "currentColor", dir = "right" }: IconProps & { dir?: "right" | "left" | "up" | "down" }) => {
    const r = { right: 0, left: 180, up: -90, down: 90 }[dir];
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ transform: `rotate(${r}deg)` }}>
        <path d="m9 6 6 6-6 6"/>
      </svg>
    );
  },
  Play: ({ s = 22, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c}><path d="M7 5v14l12-7z"/></svg>
  ),
  Heart: ({ s = 20, c = "currentColor", filled = false }: IconProps & { filled?: boolean }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={filled ? c : "none"} stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-5-9-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 5-9 10-9 10Z"/>
    </svg>
  ),
  Share: ({ s = 20, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v13M8 7l4-4 4 4"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>
    </svg>
  ),
  Walk: ({ s = 18, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13" cy="4" r="2"/><path d="M11 21 13 14 9 11 11 7l3 3 3 1M9 21l1-7"/>
    </svg>
  ),
  Layers: ({ s = 18, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5M3 18l9 5 9-5"/>
    </svg>
  ),
  Plus: ({ s = 18, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  Minus: ({ s = 18, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round">
      <path d="M5 12h14"/>
    </svg>
  ),
  Info: ({ s = 18, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/>
    </svg>
  ),
  Video: ({ s = 18, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="14" height="10" rx="2"/><path d="m22 8-6 4 6 4V8Z"/>
    </svg>
  ),
  Home: ({ s = 18, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2V10Z"/>
    </svg>
  ),
  Sun: ({ s = 14, c = "currentColor" }: IconProps) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
    </svg>
  ),
};
