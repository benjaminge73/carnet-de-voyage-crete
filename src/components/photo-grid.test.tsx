import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PhotoGrid } from "./photo-grid";
import type { PhotoEntry } from "@/lib/photos";

const tones: [string, string] = ["#aaa", "#bbb"];

const sample: PhotoEntry[] = [
  { url: "/photos/a.jpg", datetime: "2026-04-21T10:00:00.000Z", lat: 35.1, lng: 25.1 },
  { url: "/photos/b.jpg", datetime: "2026-04-21T11:00:00.000Z", lat: 35.1, lng: 25.1 },
  { url: "/photos/c.mp4", datetime: "2026-04-21T12:00:00.000Z", lat: 35.1, lng: 25.1, kind: "video" },
];

describe("<PhotoGrid>", () => {
  it("renders one link per photo, in order, pointing at /day/{id}/lightbox/{i}", () => {
    render(<PhotoGrid photos={sample} dayId={3} tones={tones} />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveAttribute("href", "/day/3/lightbox/0");
    expect(links[1]).toHaveAttribute("href", "/day/3/lightbox/1");
    expect(links[2]).toHaveAttribute("href", "/day/3/lightbox/2");
  });

  it("computes lightbox indices against referencePhotos when provided", () => {
    // Use case: the place page renders a subset of the day's photos but the
    // lightbox slides come from the full day pellicule.
    const reference: PhotoEntry[] = [
      sample[2], // c.mp4
      sample[0], // a.jpg
      { url: "/photos/extra.jpg", datetime: null, lat: null, lng: null },
      sample[1], // b.jpg
    ];
    render(
      <PhotoGrid photos={[sample[0], sample[1]]} dayId={3} tones={tones} referencePhotos={reference} />,
    );
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/day/3/lightbox/1"); // a.jpg
    expect(links[1]).toHaveAttribute("href", "/day/3/lightbox/3"); // b.jpg
  });

  it("renders an empty grid (no links) when given no photos", () => {
    render(<PhotoGrid photos={[]} dayId={1} tones={tones} />);
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("renders a <video> for entries with kind: video", () => {
    const { container } = render(
      <PhotoGrid photos={[sample[2]]} dayId={1} tones={tones} />,
    );
    expect(container.querySelector("video")).toBeTruthy();
  });
});
