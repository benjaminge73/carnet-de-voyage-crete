"use client";

import {
  TRIP,
  DAY_TONES,
  MERGED_INTO,
  MERGED_CHILD_IDS,
  mergedDayIdsFor,
  type Day,
} from "@/data/trip";
import { Icon } from "@/components/icons";

function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

// "21 — 30 avril 2026" → "21 - 30 Avril 2026"
function formatDates(s: string): string {
  return s
    .replace(/—/g, "-")
    .replace(/\b([a-zéû]+)(?=\s+\d{4}\b)/i, (m) => capitalize(m));
}

export function DesktopSidebar({
  selectedDay,
  onSelectDay,
}: {
  selectedDay: number;
  onSelectDay: (id: number) => void;
}) {
  // Build display groups: merged children share one card with their parent.
  const groups: { days: Day[] }[] = [];
  for (const day of TRIP.days) {
    if (MERGED_INTO[day.id]) {
      const ids = mergedDayIdsFor(day.id);
      groups.push({ days: TRIP.days.filter((d) => ids.includes(d.id)) });
    } else if (!MERGED_CHILD_IDS.has(day.id)) {
      groups.push({ days: [day] });
    }
  }

  return (
    <aside className="dt-sidebar">
      <div className="dt-sidebar-head">
        <div className="eyebrow">Itinéraire</div>
        <div className="dt-sidebar-dates">
          <span className="serif dt-sidebar-dates-full">{formatDates(TRIP.dates)}</span>
        </div>
      </div>

      <div className="dt-timeline">
        <div className="dt-timeline-rail" />
        {groups.map(({ days }) => {
          const first = days[0];
          const i = TRIP.days.findIndex((d) => d.id === first.id);
          const active = days.some((d) => d.id === selectedDay);
          const tones = DAY_TONES[i] ?? DAY_TONES[0];
          const totalKm = days.reduce((s, d) => s + d.km, 0);
          const totalPlaces = days.flatMap((d) => d.places).length;
          const dateLabel =
            days.length > 1
              ? `${first.weekday} ${first.date} → ${days[days.length - 1].date}`
              : `${first.weekday} ${first.date}`;
          const dotLabel =
            days.length > 1 ? days.map((d) => d.id).join("+") : String(first.id);
          const title =
            days.length > 1
              ? days.map((d) => d.title).join(" · ")
              : first.title;
          return (
            <button
              key={first.id}
              className={`dt-day ${active ? "active" : ""}`}
              onClick={() => onSelectDay(first.id)}
            >
              <div
                className="dt-day-dot"
                style={{ background: active ? "var(--terracotta)" : tones[1] }}
              >
                <span className="serif">{dotLabel}</span>
              </div>
              <div className="dt-day-body">
                <div className="dt-day-meta">
                  <span className="dt-day-date">{dateLabel}</span>
                  <span className="dt-day-km">{totalKm} km</span>
                </div>
                <div className="serif dt-day-title">{title}</div>
                <div className="dt-day-stage">
                  <Icon.Pin s={11} c="var(--ink-3)" /> {first.stage}
                  <span className="dt-day-places">
                    · {totalPlaces} {totalPlaces > 1 ? "lieux" : "lieu"}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
