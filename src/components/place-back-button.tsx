"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/icons";

export function PlaceBackButton() {
  const router = useRouter();

  const onClick = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <button
      onClick={onClick}
      aria-label="Retour"
      style={{
        width: 36, height: 36, borderRadius: 100, border: "none",
        background: "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", color: "var(--ink)",
      }}
    >
      <Icon.Back s={18} />
    </button>
  );
}
