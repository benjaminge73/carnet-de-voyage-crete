import { describe, it, expect } from "vitest";
import { parseRatio } from "./ratio";

describe("parseRatio", () => {
  it("handles the '1' alias (square)", () => {
    expect(parseRatio("1")).toEqual({ css: "1 / 1", value: 1 });
  });

  it("handles '4:3' alias", () => {
    expect(parseRatio("4:3")).toEqual({ css: "4 / 3", value: 4 / 3 });
  });

  it("handles '3:4' alias", () => {
    expect(parseRatio("3:4")).toEqual({ css: "3 / 4", value: 3 / 4 });
  });

  it("handles '16:9' alias", () => {
    expect(parseRatio("16:9")).toEqual({ css: "16 / 9", value: 16 / 9 });
  });

  it("parses arbitrary 'N/M' as both CSS and numeric value", () => {
    expect(parseRatio("2/3")).toEqual({ css: "2/3", value: 2 / 3 });
    expect(parseRatio("21 / 9")).toEqual({ css: "21 / 9", value: 21 / 9 });
  });

  it("falls back to square when input is unparseable", () => {
    expect(parseRatio("garbage")).toEqual({ css: "garbage", value: 1 });
    expect(parseRatio("")).toEqual({ css: "", value: 1 });
  });

  it("accepts a number directly", () => {
    expect(parseRatio(1.5)).toEqual({ css: "1.5", value: 1.5 });
  });
});
