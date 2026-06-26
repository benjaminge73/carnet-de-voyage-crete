import Link from "next/link";
import { Icon } from "@/components/icons";

interface HomeButtonProps {
  variant?: "dark" | "overlay";
}

export function HomeButton({ variant = "dark" }: HomeButtonProps) {
  const isOverlay = variant === "overlay";

  return (
    <Link
      href="/"
      aria-label="Accueil"
      style={{
        width: 36, height: 36, borderRadius: 100,
        background: isOverlay ? "rgba(255,255,255,0.95)" : "rgba(26,20,16,0.06)",
        backdropFilter: isOverlay ? "blur(10px)" : undefined,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--ink)",
      }}
    >
      <Icon.Home s={18} />
    </Link>
  );
}
