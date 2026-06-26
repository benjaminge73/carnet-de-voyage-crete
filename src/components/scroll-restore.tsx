"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ScrollRestore() {
  const pathname = usePathname();

  useEffect(() => {
    const el = document.querySelector(".scroll-area") as HTMLElement | null;
    if (!el) return;

    const key = `scroll:${pathname}`;
    const raw = sessionStorage.getItem(key);
    const stored = raw ? Number(raw) : 0;
    el.scrollTop = stored;

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        sessionStorage.setItem(key, String(el.scrollTop));
        raf = 0;
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
      sessionStorage.setItem(key, String(el.scrollTop));
    };
  }, [pathname]);

  return null;
}
