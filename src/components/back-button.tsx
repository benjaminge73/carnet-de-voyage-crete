"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

interface BackButtonProps {
  fallbackHref?: string;
  variant?: "light" | "dark";
}

export function BackButton({ fallbackHref = "/", variant = "dark" }: BackButtonProps) {
  const router = useRouter();

  const onClick = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  const isLight = variant === "light";

  return (
    <button
      onClick={onClick}
      aria-label="Retour"
      style={{
        width: 36, height: 36, borderRadius: 100, border: "none",
        background: isLight ? "rgba(255,255,255,0.12)" : "rgba(26,20,16,0.06)",
        backdropFilter: isLight ? "blur(10px)" : undefined,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", color: isLight ? "white" : "var(--ink)",
      }}
    >
      <Icon.Back s={18} c={isLight ? "white" : "currentColor"} />
    </button>
  );
}
