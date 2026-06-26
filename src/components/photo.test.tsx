import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Photo } from "./photo";

const R2 = "https://photos.example.com";

describe("<Photo>", () => {
  it("renders an <img> through Cloudflare Image Resizing for an R2 URL", () => {
    render(<Photo url={`${R2}/traveler-1/IMG_6830.jpeg`} label="ma photo" />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("alt", "ma photo");
    expect(img.getAttribute("src")).toContain("/cdn-cgi/image/");
    expect(img.getAttribute("src")).toContain("width=400");
  });

  it("snaps width to the next canonical bucket", () => {
    render(<Photo url={`${R2}/a.jpg`} width={201} label="x" />);
    expect(screen.getByRole("img").getAttribute("src")).toContain("width=400");
  });

  it("renders a gradient placeholder when no url is provided", () => {
    const { container } = render(<Photo tones={["#aaa", "#bbb"]} label="vide" />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(container.querySelector(".photo-ph-label")).toHaveTextContent("vide");
  });

  it("renders a <video> tag (not an <img>) when kind=video", () => {
    const { container } = render(
      <Photo url={`${R2}/clip.mp4`} kind="video" label="clip" />,
    );
    expect(container.querySelector("video")).toBeTruthy();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("applies eager loading + high fetch priority when priority=true", () => {
    render(<Photo url={`${R2}/a.jpg`} label="hero" priority />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("loading", "eager");
    expect(img.getAttribute("fetchpriority") ?? img.getAttribute("fetchPriority")).toBe("high");
  });

  it("passes a 16:9 aspect-ratio through to the placeholder div", () => {
    const { container } = render(<Photo url={`${R2}/a.jpg`} ratio="16:9" label="x" />);
    const ph = container.querySelector(".photo-ph") as HTMLElement;
    expect(ph.style.aspectRatio).toBe("16 / 9");
  });
});
